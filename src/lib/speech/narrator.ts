/**
 * Narrator — reads a list of items aloud, one after another, anywhere in the app.
 *
 * Each item plays its recorded clip when it has one, otherwise (or if the clip fails)
 * the device voice reads its text. A short silent gap follows every item. Supports
 * pause, resume and stop, and never freezes: a stalled speech engine is caught by a
 * watchdog, and with no speech support at all the list still advances at a reading pace.
 *
 * One narration plays at a time; starting a new one replaces the current one.
 */

import { pickVoice } from '@lib/session/audioManager';
import { Logger } from '@utils/logger';

export interface NarrationItem {
    /** The text to read (also the fallback if the clip is missing or fails). */
    text: string;
    /** Path to a recorded clip, when one exists. */
    clip?: string;
    /** Silence after this item, in ms. Defaults to a short natural pause. */
    afterMs?: number;
}

export type NarratorStatus = 'idle' | 'playing' | 'paused';

export interface NarratorSnapshot {
    status: NarratorStatus;
    /** Index of the item being read, or -1 when idle. */
    index: number;
    total: number;
}

export interface StartOptions {
    /** Called as each item begins (for example to highlight the current step). */
    onItemStart?: (index: number) => void;
    /** Called once after the final item and its gap, but not when stopped early. */
    onDone?: () => void;
}

const DEFAULT_GAP_MS = 700;
/** Rough speaking time per character at the slowed device-voice rate. */
const MS_PER_CHAR = 85;

const IDLE: NarratorSnapshot = { status: 'idle', index: -1, total: 0 };

export class Narrator {
    private items: NarrationItem[] = [];
    private status: NarratorStatus = 'idle';
    private index = -1;
    /** Incremented whenever playback is replaced or stopped, so stale callbacks are ignored. */
    private token = 0;

    private audio: HTMLAudioElement | null = null;
    private speaking = false;
    private watchdog: ReturnType<typeof setTimeout> | null = null;

    private gapTimer: ReturnType<typeof setTimeout> | null = null;
    private gapCallback: (() => void) | null = null;
    private gapPending = false;
    private gapRemainingMs = 0;
    private gapStartedAt = 0;

    private onItemStart: ((index: number) => void) | undefined;
    private onDone: (() => void) | undefined;

    private listeners = new Set<() => void>();
    private snap: NarratorSnapshot = IDLE;

    // ── React external-store API ──────────────────────────────────────────────

    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };

    getSnapshot = (): NarratorSnapshot => this.snap;

    // ── Public API ────────────────────────────────────────────────────────────

    /** Start reading `items`, replacing anything already playing. */
    start(items: NarrationItem[], options: StartOptions = {}): void {
        this.stop();
        if (items.length === 0) return;
        this.items = items;
        this.onItemStart = options.onItemStart;
        this.onDone = options.onDone;
        this.status = 'playing';
        this.playIndex(this.token, 0);
    }

    pause(): void {
        if (this.status !== 'playing') return;
        if (this.gapTimer !== null) {
            clearTimeout(this.gapTimer);
            this.gapTimer = null;
            this.gapRemainingMs = Math.max(
                0,
                this.gapRemainingMs - (Date.now() - this.gapStartedAt)
            );
            this.gapPending = true;
        } else if (this.audio) {
            this.audio.pause();
        } else if (this.speaking) {
            this.synth()?.pause();
        }
        this.status = 'paused';
        this.publish();
    }

    resume(): void {
        if (this.status !== 'paused') return;
        this.status = 'playing';
        if (this.gapPending) {
            this.gapPending = false;
            this.startGap(this.gapRemainingMs, this.gapCallback ?? (() => undefined));
        } else if (this.audio) {
            this.audio.play().catch((err: unknown) => {
                Logger.warn('Narrator: resume failed', String(err));
            });
        } else if (this.speaking) {
            this.synth()?.resume();
        }
        this.publish();
    }

    /** Stop immediately and forget the current list. Does not call onDone. */
    stop(): void {
        this.token += 1;
        this.clearPlayback();
        this.items = [];
        this.onItemStart = undefined;
        this.onDone = undefined;
        this.status = 'idle';
        this.index = -1;
        this.publish();
    }

    // ── Playback ──────────────────────────────────────────────────────────────

    private playIndex(token: number, i: number): void {
        if (token !== this.token) return;

        if (i >= this.items.length) {
            const done = this.onDone;
            this.items = [];
            this.status = 'idle';
            this.index = -1;
            this.onItemStart = undefined;
            this.onDone = undefined;
            this.publish();
            done?.();
            return;
        }

        const item = this.items[i]!;
        this.index = i;
        this.publish();
        this.onItemStart?.(i);

        const next = () => {
            if (token !== this.token) return;
            this.startGap(item.afterMs ?? DEFAULT_GAP_MS, () => this.playIndex(token, i + 1));
        };

        if (item.clip) {
            this.playClip(token, item, next);
        } else {
            this.speak(token, item.text, next);
        }
    }

    private playClip(token: number, item: NarrationItem, next: () => void): void {
        const audio = new Audio(item.clip);
        this.audio = audio;
        let fellBack = false;

        const fallBack = () => {
            if (token !== this.token || this.audio !== audio || fellBack) return;
            fellBack = true;
            this.audio = null;
            Logger.warn(`Narrator: clip failed, using device voice (${item.clip ?? ''})`);
            this.speak(token, item.text, next);
        };

        audio.addEventListener('ended', () => {
            if (token !== this.token || this.audio !== audio) return;
            this.audio = null;
            next();
        });
        audio.addEventListener('error', fallBack);
        audio.play().catch(fallBack);
    }

    private speak(token: number, text: string, next: () => void): void {
        const readingMs = text.length * MS_PER_CHAR;
        const synth = this.synth();

        if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
            // No device voice: keep the list moving at a reading pace.
            this.startGap(readingMs, next);
            return;
        }

        this.speaking = true;
        const done = () => {
            if (token !== this.token) return;
            if (this.status === 'paused') {
                // Never advance while paused; check again shortly.
                this.armWatchdog(done, 1000);
                return;
            }
            this.clearWatchdog();
            this.speaking = false;
            next();
        };

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.85;
        utterance.pitch = 0.95;
        utterance.volume = 1;
        const voice = pickVoice(synth.getVoices());
        if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang;
        }
        utterance.onend = done;
        utterance.onerror = done;
        // Some engines never report the end; do not let that freeze the list.
        this.armWatchdog(done, readingMs * 2 + 5000);
        synth.speak(utterance);
    }

    // ── Timers and cleanup ────────────────────────────────────────────────────

    private startGap(ms: number, callback: () => void): void {
        this.gapCallback = callback;
        this.gapRemainingMs = ms;
        this.gapStartedAt = Date.now();
        this.gapTimer = setTimeout(() => {
            this.gapTimer = null;
            callback();
        }, ms);
    }

    private armWatchdog(fn: () => void, ms: number): void {
        this.clearWatchdog();
        this.watchdog = setTimeout(fn, ms);
    }

    private clearWatchdog(): void {
        if (this.watchdog !== null) {
            clearTimeout(this.watchdog);
            this.watchdog = null;
        }
    }

    private clearPlayback(): void {
        this.clearWatchdog();
        if (this.gapTimer !== null) {
            clearTimeout(this.gapTimer);
            this.gapTimer = null;
        }
        this.gapPending = false;
        this.gapCallback = null;
        this.speaking = false;
        if (this.audio) {
            const audio = this.audio;
            this.audio = null;
            audio.pause();
            audio.src = '';
        }
        this.synth()?.cancel();
    }

    private synth(): SpeechSynthesis | undefined {
        return typeof window !== 'undefined' ? window.speechSynthesis : undefined;
    }

    private publish(): void {
        this.snap = { status: this.status, index: this.index, total: this.items.length };
        this.listeners.forEach(l => {
            try {
                l();
            } catch (err) {
                Logger.error('Narrator listener threw:', String(err));
            }
        });
    }
}

/** Shared narrator: only one thing is read aloud at a time across the whole app. */
export const narrator = new Narrator();
