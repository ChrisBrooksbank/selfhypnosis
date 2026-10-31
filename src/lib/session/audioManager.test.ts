import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AudioManager } from './audioManager';

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
