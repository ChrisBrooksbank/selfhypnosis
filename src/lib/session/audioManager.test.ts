import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { AudioManager, pickVoice } from './audioManager';

/**
 * Minimal HTMLAudioElement stand-in. Like real browsers, assigning an empty `src`
 * fires an asynchronous `error` event (the resource load "fails").
 */
class FakeAudio {
    static instances: FakeAudio[] = [];
    private listeners: Record<string, (() => void)[]> = {};
    private _src: string;
    preload = '';

    constructor(src = '') {
        this._src = src;
        FakeAudio.instances.push(this);
    }

    get src() {
        return this._src;
    }

    set src(value: string) {
        this._src = value;
        if (value === '') queueMicrotask(() => this.emit('error'));
    }

    addEventListener(type: string, cb: () => void) {
        (this.listeners[type] ??= []).push(cb);
    }

    emit(type: string) {
        this.listeners[type]?.forEach(cb => cb());
    }

    hasListener(type: string) {
        return (this.listeners[type]?.length ?? 0) > 0;
    }

    play() {
        return Promise.resolve();
    }

    pause() {}
}

/** The element currently driving playback (the one with an `ended` listener). */
function current(): FakeAudio {
    const el = [...FakeAudio.instances].reverse().find(a => a.hasListener('ended') && a.src);
    if (!el) throw new Error('no active audio element');
    return el;
}

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

describe('AudioManager sequential playback', () => {
    beforeEach(() => {
        FakeAudio.instances = [];
        vi.stubGlobal('Audio', FakeAudio);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('keeps playing later segments after earlier ones end', async () => {
        const manager = new AudioManager();
        const onError = vi.fn();
        manager.onError = onError;
        manager.loadSession('beginner-relaxation');
        expect(manager.snapshot().textOnly).toBe(false);

        for (let i = 0; i < 4; i++) {
            manager.playSegment('preparation', i);
            await flush();
            // Clearing the previous element must not poison the session.
            expect(manager.snapshot().textOnly).toBe(false);
            expect(onError).not.toHaveBeenCalled();
            expect(current().src).toContain(`preparation-${i}.mp3`);
            current().emit('ended');
        }
    });

    it('still falls back to text-only when the current clip genuinely fails', () => {
        const manager = new AudioManager();
        const onError = vi.fn();
        manager.onError = onError;
        manager.loadSession('beginner-relaxation');
        manager.playSegment('preparation', 0);

        current().emit('error');

        expect(manager.snapshot().textOnly).toBe(true);
        expect(onError).toHaveBeenCalledOnce();
    });
});

// ─── Device voice (text with no recording) ──────────────────────────────────

class FakeUtterance {
    rate = 1;
    pitch = 1;
    volume = 1;
    lang = '';
    voice: unknown = null;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(public text: string) {}
}

function fakeSynth(voices: { name: string; lang: string }[] = []) {
    const spoken: FakeUtterance[] = [];
    const synth = {
        spoken,
        speak: vi.fn((u: FakeUtterance) => spoken.push(u)),
        cancel: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        getVoices: () => voices,
    };
    return synth;
}

describe('AudioManager device voice', () => {
    let manager: AudioManager;
    let onSegmentEnd: Mock<() => void>;
    let synth: ReturnType<typeof fakeSynth>;

    beforeEach(() => {
        vi.useFakeTimers();
        FakeAudio.instances = [];
        vi.stubGlobal('Audio', FakeAudio);
        synth = fakeSynth();
        vi.stubGlobal('speechSynthesis', synth);
        vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
        manager = new AudioManager();
        onSegmentEnd = vi.fn<() => void>();
        manager.onSegmentEnd = onSegmentEnd;
        manager.loadSession('stress-relief');
    });

    afterEach(() => {
        manager.stop();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('speaks the text slowly, then advances after a silent gap', () => {
        manager.speak('I am calm.', 8);
        const u = synth.spoken[0]!;
        expect(u.text).toBe('I am calm.');
        expect(u.rate).toBeLessThan(1);

        u.onend?.();
        vi.advanceTimersByTime(7_900);
        expect(onSegmentEnd).not.toHaveBeenCalled();
        vi.advanceTimersByTime(200);
        expect(onSegmentEnd).toHaveBeenCalledOnce();
    });

    it('holds the script while paused and resumes with the remaining gap', () => {
        manager.speak('I am calm.', 8);
        synth.spoken[0]!.onend?.();
        vi.advanceTimersByTime(3_000);

        manager.pause();
        vi.advanceTimersByTime(60_000);
        expect(onSegmentEnd).not.toHaveBeenCalled();

        manager.resume();
        vi.advanceTimersByTime(4_900);
        expect(onSegmentEnd).not.toHaveBeenCalled();
        vi.advanceTimersByTime(200);
        expect(onSegmentEnd).toHaveBeenCalledOnce();
    });

    it('pauses and resumes the spoken line itself', () => {
        manager.speak('I am calm.');
        manager.pause();
        expect(synth.pause).toHaveBeenCalled();
        manager.resume();
        expect(synth.resume).toHaveBeenCalled();
    });

    it('ignores a replaced utterance finishing late', () => {
        manager.speak('First.', 1);
        const first = synth.spoken[0]!;
        manager.playSegment('suggestion', 0); // replaces it with a recorded clip
        expect(synth.cancel).toHaveBeenCalled();

        first.onend?.();
        vi.advanceTimersByTime(10_000);
        expect(onSegmentEnd).not.toHaveBeenCalled();
    });

    it('does not freeze if the speech engine never reports the end', () => {
        manager.speak('Never ends.', 2);
        // readingMs*2 + 5s watchdog, then the gap
        vi.advanceTimersByTime(60_000);
        expect(onSegmentEnd).toHaveBeenCalledOnce();
    });

    it('still advances at reading pace when there is no device voice', () => {
        vi.stubGlobal('speechSynthesis', undefined);
        vi.stubGlobal('SpeechSynthesisUtterance', undefined);
        manager.speak('A short line.', 2);
        vi.advanceTimersByTime(60_000);
        expect(onSegmentEnd).toHaveBeenCalledOnce();
    });

    it('stop() cancels a pending advance', () => {
        manager.speak('I am calm.', 8);
        synth.spoken[0]!.onend?.();
        manager.stop();
        vi.advanceTimersByTime(60_000);
        expect(onSegmentEnd).not.toHaveBeenCalled();
    });

    it('reports a missing clip as an error without switching the session to text-only', () => {
        const onError = vi.fn();
        manager.onError = onError;
        manager.playSegment('suggestion', 999);
        expect(onError).toHaveBeenCalledOnce();
        expect(manager.snapshot().textOnly).toBe(false);
    });
});

describe('pickVoice', () => {
    const v = (name: string, lang: string) => ({ name, lang }) as SpeechSynthesisVoice;

    it('prefers natural/neural English voices', () => {
        const picked = pickVoice([
            v('Microsoft David', 'en-US'),
            v('Microsoft Sonia Online (Natural)', 'en-GB'),
            v('Microsoft Hortense', 'fr-FR'),
        ]);
        expect(picked?.name).toBe('Microsoft Sonia Online (Natural)');
    });

    it('ignores non-English voices and returns undefined when none are English', () => {
        expect(pickVoice([v('Hortense', 'fr-FR')])).toBeUndefined();
        expect(pickVoice([])).toBeUndefined();
    });
});
