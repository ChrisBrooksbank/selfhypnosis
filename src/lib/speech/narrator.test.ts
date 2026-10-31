import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Narrator, type NarrationItem } from './narrator';

class FakeAudio {
    static instances: FakeAudio[] = [];
    private listeners: Record<string, (() => void)[]> = {};
    src: string;
    paused = false;
    playMock = vi.fn(() => Promise.resolve());
    pauseMock = vi.fn(() => {
        this.paused = true;
    });

    constructor(src = '') {
        this.src = src;
        FakeAudio.instances.push(this);
    }

    addEventListener(type: string, cb: () => void) {
        (this.listeners[type] ??= []).push(cb);
    }

    emit(type: string) {
        this.listeners[type]?.forEach(cb => cb());
    }

    play() {
        return this.playMock();
    }

    pause() {
        this.pauseMock();
    }
}

class FakeUtterance {
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    rate = 1;
    pitch = 1;
    volume = 1;
    lang = '';
    voice: unknown = null;
    constructor(public text: string) {}
}

function fakeSynth() {
    const spoken: FakeUtterance[] = [];
    return {
        spoken,
        speak: vi.fn((u: FakeUtterance) => spoken.push(u)),
        cancel: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        getVoices: () => [],
    };
}

const lastAudio = () => FakeAudio.instances[FakeAudio.instances.length - 1]!;

describe('Narrator', () => {
    let narrator: Narrator;
    let synth: ReturnType<typeof fakeSynth>;

    beforeEach(() => {
        vi.useFakeTimers();
        FakeAudio.instances = [];
        synth = fakeSynth();
        vi.stubGlobal('Audio', FakeAudio);
        vi.stubGlobal('speechSynthesis', synth);
        vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
        narrator = new Narrator();
    });

    afterEach(() => {
        narrator.stop();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    const clips = (...names: string[]): NarrationItem[] =>
        names.map(n => ({ text: `text ${n}`, clip: `/audio/${n}.mp3`, afterMs: 1000 }));

    it('plays clips in order with a gap between, then reports done', () => {
        const onItemStart = vi.fn();
        const onDone = vi.fn();
        narrator.start(clips('a', 'b'), { onItemStart, onDone });

        expect(narrator.getSnapshot()).toEqual({ status: 'playing', index: 0, total: 2 });
        expect(lastAudio().src).toBe('/audio/a.mp3');

        lastAudio().emit('ended');
        vi.advanceTimersByTime(999);
        expect(onItemStart).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(2);
        expect(onItemStart).toHaveBeenLastCalledWith(1);
        expect(lastAudio().src).toBe('/audio/b.mp3');

        lastAudio().emit('ended');
        vi.advanceTimersByTime(1000);
        expect(onDone).toHaveBeenCalledOnce();
        expect(narrator.getSnapshot().status).toBe('idle');
    });

    it('reads items without a clip using the device voice', () => {
        narrator.start([{ text: 'Hello there.', afterMs: 500 }]);
        expect(synth.spoken[0]!.text).toBe('Hello there.');
        expect(synth.spoken[0]!.rate).toBeLessThan(1);
        synth.spoken[0]!.onend?.();
        vi.advanceTimersByTime(500);
        expect(narrator.getSnapshot().status).toBe('idle');
    });

    it('falls back to the device voice when a clip fails to load', () => {
        narrator.start(clips('broken'));
        lastAudio().emit('error');
        expect(synth.spoken[0]!.text).toBe('text broken');
    });

    it('falls back to the device voice when a clip is blocked from playing', async () => {
        vi.stubGlobal(
            'Audio',
            class extends FakeAudio {
                override play() {
                    return Promise.reject(new Error('blocked'));
                }
            }
        );
        narrator.start(clips('blocked'));
        await vi.advanceTimersByTimeAsync(0);
        expect(synth.spoken[0]!.text).toBe('text blocked');
    });

    it('pauses and resumes a playing clip', () => {
        narrator.start(clips('a'));
        const audio = lastAudio();
        narrator.pause();
        expect(audio.pauseMock).toHaveBeenCalled();
        expect(narrator.getSnapshot().status).toBe('paused');
        narrator.resume();
        expect(audio.playMock).toHaveBeenCalledTimes(2);
        expect(narrator.getSnapshot().status).toBe('playing');
    });

    it('holds during a gap while paused and resumes with the time that was left', () => {
        const onItemStart = vi.fn();
        narrator.start(clips('a', 'b'), { onItemStart });
        lastAudio().emit('ended'); // gap of 1000ms begins
        vi.advanceTimersByTime(400);

        narrator.pause();
        vi.advanceTimersByTime(60_000);
        expect(onItemStart).toHaveBeenCalledTimes(1);

        narrator.resume();
        vi.advanceTimersByTime(590);
        expect(onItemStart).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(20);
        expect(onItemStart).toHaveBeenCalledTimes(2);
    });

    it('pauses and resumes the device voice', () => {
        narrator.start([{ text: 'Spoken.' }]);
        narrator.pause();
        expect(synth.pause).toHaveBeenCalled();
        narrator.resume();
        expect(synth.resume).toHaveBeenCalled();
    });

    it('does not advance when speech ends while paused', () => {
        const onItemStart = vi.fn();
        narrator.start([{ text: 'One.', afterMs: 100 }, { text: 'Two.' }], { onItemStart });
        narrator.pause();
        synth.spoken[0]!.onend?.();
        vi.advanceTimersByTime(500);
        expect(onItemStart).toHaveBeenCalledTimes(1);
    });

    it('stop() cancels everything and does not report done', () => {
        const onDone = vi.fn();
        narrator.start(clips('a', 'b'), { onDone });
        const audio = lastAudio();
        narrator.stop();

        audio.emit('ended'); // stale event from the replaced element
        vi.advanceTimersByTime(60_000);

        expect(onDone).not.toHaveBeenCalled();
        expect(FakeAudio.instances).toHaveLength(1);
        expect(synth.cancel).toHaveBeenCalled();
        expect(narrator.getSnapshot()).toEqual({ status: 'idle', index: -1, total: 0 });
    });

    it('starting a new list replaces the old one cleanly', () => {
        const firstDone = vi.fn();
        narrator.start(clips('old'), { onDone: firstDone });
        const old = lastAudio();
        narrator.start(clips('new'));

        old.emit('ended');
        vi.advanceTimersByTime(10_000);
        expect(firstDone).not.toHaveBeenCalled();
        expect(lastAudio().src).toBe('/audio/new.mp3');
        expect(narrator.getSnapshot().index).toBe(0);
    });

    it('does not freeze when the speech engine never reports the end', () => {
        const onDone = vi.fn();
        narrator.start([{ text: 'Never ends.', afterMs: 100 }], { onDone });
        vi.advanceTimersByTime(60_000);
        expect(onDone).toHaveBeenCalledOnce();
    });

    it('still advances at reading pace when there is no device voice', () => {
        vi.stubGlobal('speechSynthesis', undefined);
        vi.stubGlobal('SpeechSynthesisUtterance', undefined);
        const onDone = vi.fn();
        narrator.start([{ text: 'A short line.', afterMs: 100 }], { onDone });
        vi.advanceTimersByTime(60_000);
        expect(onDone).toHaveBeenCalledOnce();
    });

    it('notifies subscribers of changes', () => {
        const listener = vi.fn();
        const unsubscribe = narrator.subscribe(listener);
        narrator.start(clips('a'));
        expect(listener).toHaveBeenCalled();
        listener.mockClear();
        unsubscribe();
        narrator.stop();
        expect(listener).not.toHaveBeenCalled();
    });

    it('ignores an empty list', () => {
        narrator.start([]);
        expect(narrator.getSnapshot().status).toBe('idle');
    });
});
