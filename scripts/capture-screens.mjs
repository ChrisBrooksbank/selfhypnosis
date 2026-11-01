#!/usr/bin/env node
/**
 * Capture README screenshots from a running static build, using headless Chrome over CDP.
 *
 *   npm run build && npx serve out -l 4391   # in another terminal
 *   node scripts/capture-screens.mjs [outDir]
 *
 * Seeds an onboarded user in IndexedDB first so the safety gate doesn't intercept.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE_URL ?? 'http://localhost:4391';
const OUT = process.argv[2] ?? 'docs/media';
const PORT = 9333;
mkdirSync(OUT, { recursive: true });

const chrome = spawn(
    CHROME,
    [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${mkdtempSync(join(tmpdir(), 'sh-chrome-'))}`,
        '--hide-scrollbars',
        'about:blank',
    ],
    { stdio: 'ignore' }
);

const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets;
for (let i = 0; i < 40; i++) {
    try {
        targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
        if (targets.length) break;
    } catch {}
    await sleep(250);
}
const page = targets.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) pending.get(m.id)(m);
};
const send = (method, params = {}) =>
    new Promise(res => {
        const i = ++id;
        pending.set(i, res);
        ws.send(JSON.stringify({ id: i, method, params }));
    });
const evalJs = async expression =>
    (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result
        ?.result?.value;

async function shot(
    path,
    name,
    { dark = false, w = 390, h = 844, wait = 1500, full = false, mobile = true, url } = {}
) {
    await send('Emulation.setDeviceMetricsOverride', {
        width: w,
        height: h,
        deviceScaleFactor: 2,
        mobile,
    });
    await send('Page.navigate', { url: url ?? BASE + path });
    await sleep(wait);
    await evalJs(`document.documentElement.classList.toggle('dark', ${dark})`);
    await sleep(300);
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full });
    writeFileSync(join(OUT, name), Buffer.from(r.result.data, 'base64'));
    console.log('wrote', name);
}

await send('Page.enable');
await shot('/onboarding', 'onboarding.png', { wait: 2500 });

await evalJs(`new Promise((res, rej) => {
  const open = indexedDB.open('SelfHypnosisDB');
  open.onsuccess = () => {
    const db = open.result;
    if (!db.objectStoreNames.contains('settings')) { rej(new Error('no stores')); return; }
    const tx = db.transaction(['settings','sessions'], 'readwrite');
    tx.objectStore('settings').put({ id:'user', onboardingComplete:true, safetyAcknowledgedAt:new Date().toISOString(),
      contraindicationAnswers:[false,false,false,false,false,false], hasContraindication:false, riskLevel:'none',
      notificationsEnabled:false, defaultSessionDuration:15, preferredTechniques:[], theme:'light' });
    const now = Date.now(), day = 86400000;
    for (let i = 0; i < 6; i++) {
      const t = new Date(now - i * day).toISOString();
      tx.objectStore('sessions').put({ id:'seed-'+i, startedAt:t, completedAt:t, type:'guided',
        templateId: i === 0 ? 'stress-relief' : 'sleep-preparation', goalArea:'stress-anxiety',
        techniquesUsed:['breathing'], plannedDurationMinutes:20, actualDurationSeconds:1200,
        phasesCompleted:['preparation','induction','deepening','suggestion','emergence'], suggestionIds:[] });
    }
    tx.oncomplete = () => res(true);
    tx.onerror = () => rej(tx.error);
  };
  open.onerror = () => rej(open.error);
})`);

await shot('/', 'home.png', { wait: 2500 });
await shot('/', 'home-dark.png', { dark: true, wait: 2500 });
await shot('/session', 'sessions.png', { wait: 2000, h: 1500 });
await shot('/library', 'library.png', { wait: 2000 });

await shot('', 'hero.png', {
    w: 1280,
    h: 520,
    mobile: false,
    wait: 800,
    url: pathToFileURL(join(import.meta.dirname, 'hero.html')).href,
});

ws.close();
chrome.kill();
process.exit(0);
