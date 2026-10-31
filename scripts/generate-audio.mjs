#!/usr/bin/env node
/**
 * Generate narration audio for every guided session using OpenAI TTS.
 *
 *   OPENAI_API_KEY=sk-... npm run generate:audio
 *   npm run generate:audio -- --dry-run            # count characters, no API calls
 *   npm run generate:audio -- --session stress-relief
 *   npm run generate:audio -- --force              # regenerate existing files
 *   npm run generate:audio -- --content            # technique pages, session blurbs, onboarding
 *
 * The key is read from the environment or from .env.local.
 * Output: public/audio/<session>/<phase>-<index>.mp3 and src/content/audio/manifest.json
 *
 * Each clip is slowed slightly, given a soft fade, and padded with silence up to the
 * segment's durationSeconds so audio stays in step with the phase timers.
 *
 * With --content it records the app's written content instead (technique pages, session
 * descriptions, onboarding and safety text) to public/audio/content/<key>.mp3 and
 * src/content/audio/content-manifest.json. Those clips are not padded.
 * Requires ffmpeg on PATH. Existing files are skipped, so the script is resumable.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SESSIONS_DIR = join(ROOT, 'src', 'content', 'sessions');
const OUT_DIR = join(ROOT, 'public', 'audio');
const MANIFEST = join(ROOT, 'src', 'content', 'audio', 'manifest.json');
const TECHNIQUES_DIR = join(ROOT, 'src', 'content', 'techniques');
const PROSE = join(ROOT, 'src', 'content', 'prose.json');
const CONTENT_MANIFEST = join(ROOT, 'src', 'content', 'audio', 'content-manifest.json');

const PHASES = ['preparation', 'induction', 'deepening', 'suggestion', 'emergence'];

const MODEL = process.env.OPENAI_TTS_MODEL ?? 'gpt-4o-mini-tts';
const VOICE = process.env.OPENAI_TTS_VOICE ?? 'sage';
/** 1.0 = unchanged. Below 1 slows the voice further for a more hypnotic pace. */
const TEMPO = Number(process.env.OPENAI_TTS_TEMPO ?? '0.9');
/** Target loudness in LUFS. Raw TTS is very quiet (about -33); -20 is a clear but gentle level. */
const LUFS = Number(process.env.OPENAI_TTS_LUFS ?? '-20');

const INSTRUCTIONS = [
    'Voice: warm, gentle and deeply soothing, like an experienced hypnotherapist guiding a client into relaxation.',
    'Pace: very slow and unhurried, with long, comfortable pauses at every comma, ellipsis and full stop.',
    'Tone: low, soft and reassuring. Almost a whisper of calm. Never bright, salesy or dramatic.',
    'Pitch: keep it low and let it drift slightly downward at the end of each sentence.',
    'Emphasis: stay even and hypnotic, with no sudden changes in volume or energy.',
].join('\n');

// ─── Helpers ────────────────────────────────────────────────────────────────

function loadEnvLocal() {
    const file = join(ROOT, '.env.local');
    if (!existsSync(file)) return;
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && process.env[m[1]] === undefined) {
            process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
        }
    }
}

function args() {
    const a = process.argv.slice(2);
    const sessionIdx = a.indexOf('--session');
    return {
        dryRun: a.includes('--dry-run'),
        content: a.includes('--content'),
        force: a.includes('--force'),
        session: sessionIdx >= 0 ? a[sessionIdx + 1] : null,
    };
}

function loadSessions(only) {
    return readdirSync(SESSIONS_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => JSON.parse(readFileSync(join(SESSIONS_DIR, f), 'utf8')))
        .filter(s => !only || s.id === only);
}

/** Make the text read well aloud: slower cadence, no symbols TTS might voice oddly. */
function prepareText(text) {
    return text
        .replace(/\s+—\s+/g, '... ')
        .replace(/—/g, ', ')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
}

/**
 * Every piece of written content to record, as { key, text }. Keys match the
 * data-speech-clip attributes in the UI. Reference lists and button labels are not spoken.
 */
function contentItems() {
    const items = [];
    const read = file => JSON.parse(readFileSync(file, 'utf8'));

    for (const f of readdirSync(TECHNIQUES_DIR).filter(f => f.endsWith('.json'))) {
        const t = read(join(TECHNIQUES_DIR, f));
        items.push({ key: `technique/${t.id}/intro`, text: `${t.name}. ${t.tagline}` });
        items.push({ key: `technique/${t.id}/overview`, text: t.overview });
        for (const step of t.steps) {
            items.push({ key: `technique/${t.id}/step-${step.number}`, text: step.instruction });
        }
        items.push({ key: `technique/${t.id}/science`, text: t.scienceBlurb });
    }

    for (const s of loadSessions(null)) {
        items.push({ key: `session/${s.id}/description`, text: `${s.name}. ${s.description}` });
    }

    const prose = read(PROSE);
    const { welcome, screening, safety, banners } = prose;
    items.push({ key: 'prose/welcome-intro', text: `${welcome.heading}. ${welcome.intro}` });
    items.push({ key: 'prose/welcome-myths-heading', text: welcome.mythsHeading });
    welcome.myths.forEach((m, i) =>
        items.push({ key: `prose/welcome-myth-${i}`, text: `Myth: ${m.myth}. Truth: ${m.truth}` })
    );
    items.push({ key: 'prose/screening-intro', text: `${screening.heading}. ${screening.intro}` });
    screening.questions.forEach((q, i) =>
        items.push({
            key: `prose/screening-question-${i}`,
            text: `Question ${i + 1}. ${q.text} ${q.explanation}`,
        })
    );
    items.push({ key: 'prose/safety-intro', text: `${safety.heading}. ${safety.intro}` });
    safety.notice.forEach((n, i) =>
        items.push({
            key: `prose/safety-notice-${i}`,
            text: i === 0 ? `${safety.noticeHeading}. ${n}` : n,
        })
    );
    items.push({ key: 'prose/safety-acknowledgement', text: safety.acknowledgement });
    items.push({ key: 'prose/banner-amber', text: banners.amber });
    items.push({ key: 'prose/banner-red', text: banners.red });
    return items;
}

async function synthesise(text, apiKey) {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: MODEL,
            voice: VOICE,
            input: prepareText(text),
            instructions: INSTRUCTIONS,
            response_format: 'mp3',
        }),
    });
    if (!res.ok) {
        throw new Error(`OpenAI TTS ${res.status}: ${await res.text()}`);
    }
    return Buffer.from(await res.arrayBuffer());
}

/** Slow slightly, fade in/out, and pad with silence to the scripted duration. */
function postProcess(rawPath, outPath, durationSeconds) {
    const probe = execFileSync(
        'ffprobe',
        ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', rawPath],
        { encoding: 'utf8' }
    );
    const spoken = Number(probe.trim()) / TEMPO;
    const total = Math.max(durationSeconds, Math.ceil(spoken) + 2);
    const fadeOutStart = Math.max(0, spoken - 0.6);
    const filter = [
        `atempo=${TEMPO}`,
        'afade=t=in:d=0.4',
        `afade=t=out:st=${fadeOutStart.toFixed(2)}:d=0.6`,
        `loudnorm=I=${LUFS}:TP=-1.5:LRA=11`,
        `apad=whole_dur=${total}`,
    ].join(',');
    execFileSync(
        'ffmpeg',
        [
            '-y',
            '-loglevel',
            'error',
            '-i',
            rawPath,
            '-af',
            filter,
            '-ar',
            '24000',
            '-ac',
            '1',
            '-b:a',
            '64k',
            outPath,
        ],
        { stdio: 'inherit' }
    );
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function generateContent({ dryRun, force }) {
    const items = contentItems();
    const chars = items.reduce((n, i) => n + prepareText(i.text).length, 0);
    console.log(
        `${items.length} content clips, ${chars.toLocaleString()} characters ` +
            `(model ${MODEL}, voice ${VOICE}, tempo ${TEMPO})`
    );
    if (dryRun) return;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('OPENAI_API_KEY is not set. Add it to .env.local or the environment.');
        process.exit(1);
    }
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });

    const manifest = {};
    const tmp = join(OUT_DIR, '.tmp-raw.mp3');
    mkdirSync(OUT_DIR, { recursive: true });
    for (const { key, text } of items) {
        const outPath = join(OUT_DIR, 'content', `${key}.mp3`);
        mkdirSync(dirname(outPath), { recursive: true });
        if (force || !existsSync(outPath)) {
            process.stdout.write(`  ${key} … `);
            writeFileSync(tmp, await synthesise(text, apiKey));
            postProcess(tmp, outPath, 0);
            console.log('done');
        } else {
            console.log(`  ${key} exists, skipped`);
        }
        manifest[key] = `/audio/content/${key}.mp3`;
        writeFileSync(CONTENT_MANIFEST, JSON.stringify(manifest, null, 4) + '\n');
    }
    if (existsSync(tmp)) rmSync(tmp);
    console.log('Content manifest updated:', CONTENT_MANIFEST);
}

async function main() {
    loadEnvLocal();
    const { dryRun, force, session, content } = args();
    if (content) return generateContent({ dryRun, force });
    const sessions = loadSessions(session);
    if (sessions.length === 0) {
        console.error(`No sessions found${session ? ` matching "${session}"` : ''}.`);
        process.exit(1);
    }

    let chars = 0;
    let clips = 0;
    for (const s of sessions) {
        for (const p of PHASES) {
            for (const seg of s.phases[p]?.segments ?? []) {
                chars += prepareText(seg.text).length;
                clips += 1;
            }
        }
    }
    console.log(
        `${sessions.length} session(s), ${clips} clips, ${chars.toLocaleString()} characters ` +
            `(model ${MODEL}, voice ${VOICE}, tempo ${TEMPO})`
    );
    if (dryRun) return;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('OPENAI_API_KEY is not set. Add it to .env.local or the environment.');
        process.exit(1);
    }
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });

    const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
    const tmp = join(OUT_DIR, '.tmp-raw.mp3');

    for (const s of sessions) {
        manifest[s.id] = {};
        for (const phase of PHASES) {
            manifest[s.id][phase] = {};
            const segments = s.phases[phase]?.segments ?? [];
            for (let i = 0; i < segments.length; i++) {
                const rel = `/audio/${s.id}/${phase}-${i}.mp3`;
                const outPath = join(OUT_DIR, s.id, `${phase}-${i}.mp3`);
                mkdirSync(dirname(outPath), { recursive: true });
                if (force || !existsSync(outPath)) {
                    process.stdout.write(`  ${s.id} ${phase}[${i}] … `);
                    writeFileSync(tmp, await synthesise(segments[i].text, apiKey));
                    postProcess(tmp, outPath, segments[i].durationSeconds);
                    console.log('done');
                } else {
                    console.log(`  ${s.id} ${phase}[${i}] exists, skipped`);
                }
                manifest[s.id][phase][String(i)] = rel;
            }
        }
        // Save progress after each session so an interrupted run loses nothing.
        writeFileSync(MANIFEST, JSON.stringify(manifest, null, 4) + '\n');
    }
    if (existsSync(tmp)) rmSync(tmp);
    console.log('Manifest updated:', MANIFEST);
}

main().catch(err => {
    console.error(err.message ?? err);
    process.exit(1);
});
