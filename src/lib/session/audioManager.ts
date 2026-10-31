/**
 * Audio Manager — manages HTML5 audio playback queue for guided sessions.
 *
 * Loads audio file paths from the content/audio/manifest.json, plays segments
 * in sequence, and preloads the next phase while current phase plays.
 *
 * Falls back to text-only mode if audio fails to load or no audio is available.
 */

import { Logger } from '@utils/logger';
import type { PhaseId } from '@/types';
import manifestJson from '@/content/audio/manifest.json';

// ─── Manifest Types ────────────────────────────────────────────────────────────

/**
 * Shape of src/content/audio/manifest.json.
 * { [sessionId]: { [phaseId]: { [segmentIndex]: filePath } } }
 */
type AudioManifest = Record<string, Record<string, Record<string, string>>>;

// Static JSON, bundled at build time and available before any instances are created.
const MANIFEST: AudioManifest = manifestJson as AudioManifest;

// ─── Public Types ──────────────────────────────────────────────────────────────

export type SegmentEndCallback = () => void;
export type PhaseEndCallback = () => void;
export type ErrorCallback = (message: string) => void;

export interface AudioManagerSnapshot {
    sessionId: string | null;
    phase: PhaseId | null;
    segmentIndex: number;
    isPlaying: boolean;
    isPaused: boolean;
    /** True when audio is unavailable and session runs text-only. */
    textOnly: boolean;
}

// ─── Device voice (for text with no recording, e.g. the user's own suggestions) ─

/** Silence after a spoken line, before the next one, so suggestions have room to land. */
const SPEECH_GAP_SECONDS = 8;
/** Rough speaking time per character at the slowed device-voice rate. */
const MS_PER_CHAR = 85;

const PREFERRED_VOICE = /natural|neural|online|premium|enhanced/i;
const KNOWN_GOOD_VOICE =
    /google uk english female|samantha|serena|moira|karen|libby|sonia|jenny|aria/i;

/** The most pleasant-sounding English voice available on this device, if any. */
export function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
    const english = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
    const score = (v: SpeechSynthesisVoice) =>
        (PREFERRED_VOICE.test(v.name) ? 4 : 0) +
        (KNOWN_GOOD_VOICE.test(v.name) ? 2 : 0) +
        (v.lang.toLowerCase() === 'en-gb' ? 1 : 0);
    return [...english].sort((a, b) => score(b) - score(a))[0];
}

// ─── AudioManager ─────────────────────────────────────────────────────────────

export class AudioManager {
    private _sessionId: string | null = null;
    private _phase: PhaseId | null = null;
    private _segmentIndex = 0;
    private _isPlaying = false;
    private _isPaused = false;
    private _textOnly = false;

    private _audio: HTMLAudioElement | null = null;
    /** Pre-loaded audio for the next phase to reduce loading latency. */
    private _preload: HTMLAudioElement | null = null;

    // Device-voice state: a spoken line followed by a silent gap, both cancellable.
    private _speaking = false;
    private _speechToken = 0;
    private _gapTimer: ReturnType<typeof setTimeout> | null = null;
    private _gapPending = false;
    private _gapRemainingMs = 0;
    private _gapStartedAt = 0;
    private _watchdog: ReturnType<typeof setTimeout> | null = null;

    private _onSegmentEnd: SegmentEndCallback | null = null;
    private _onPhaseEnd: PhaseEndCallback | null = null;
    private _onError: ErrorCallback | null = null;

    // ── Event handler setters ─────────────────────────────────────────────────

    set onSegmentEnd(cb: SegmentEndCallback) {
        this._onSegmentEnd = cb;
    }

    set onPhaseEnd(cb: PhaseEndCallback) {
        this._onPhaseEnd = cb;
    }

    set onError(cb: ErrorCallback) {
        this._onError = cb;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Load a session by ID. Resolves once the manifest entry has been checked.
     * Switches to text-only mode silently if no audio is registered for the session.
     */
    loadSession(sessionId: string): void {
        this.stop();
        this._sessionId = sessionId;
        this._textOnly = !this._hasAudioForSession(sessionId);

        if (this._textOnly) {
            Logger.info(`AudioManager: no audio for session "${sessionId}" — text-only mode`);
        } else {
            Logger.info(`AudioManager: loaded session "${sessionId}"`);
        }
    }

    /**
     * Play a specific segment within the current session.
     * If audio is unavailable for this segment, emits onError and stays text-only.
     */
    playSegment(phaseId: PhaseId, segmentIndex: number): void {
        if (!this._sessionId) {
            Logger.warn('AudioManager.playSegment(): no session loaded');
            return;
        }

        this._phase = phaseId;
        this._segmentIndex = segmentIndex;

        const path = this._resolveAudioPath(this._sessionId, phaseId, segmentIndex);
        if (!path) {
            // The caller decides what plays; a missing clip must never freeze the script.
            const msg = `No audio clip for ${phaseId}[${segmentIndex}]`;
            Logger.warn(`AudioManager: ${msg}`);
            this._emitError(msg);
            return;
        }

        this._cancelSpeech();
        this._stopCurrentAudio();
        this._playPath(path, phaseId, segmentIndex);
    }

    /**
     * Speak text that has no recording using the device voice, then wait a short silent
     * gap and fire onSegmentEnd, exactly as a finished clip would. If speech is
     * unavailable or stalls, the script still advances at a reading pace.
     */
    speak(text: string, gapSeconds = SPEECH_GAP_SECONDS): void {
        this._cancelSpeech();
        this._stopCurrentAudio();
        const token = this._speechToken;
        this._isPaused = false;
        this._isPlaying = true;
        const gapMs = gapSeconds * 1000;
        const readingMs = text.length * MS_PER_CHAR;

        const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
        if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
            Logger.warn('AudioManager: no device voice — advancing at reading pace');
            this._startGap(readingMs + gapMs);
            return;
        }

        this._speaking = true;
        const done = () => {
            if (token !== this._speechToken) return; // cancelled or replaced
            if (this._isPaused) {
                // Never advance while paused; check again shortly.
                this._armWatchdog(done, 1000);
                return;
            }
            this._clearWatchdog();
            this._speaking = false;
            this._startGap(gapMs);
        };

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.pitch = 0.9;
        utterance.volume = 1;
        const voice = pickVoice(synth.getVoices());
        if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang;
        }
        utterance.onend = done;
        utterance.onerror = done;
        // Some engines never fire `end`; don't let that freeze the session.
        this._armWatchdog(done, readingMs * 2 + 5000);
        synth.speak(utterance);
        Logger.debug('AudioManager: speaking with device voice');
    }

    /** Pause current playback. */
    pause(): void {
        if ((this._speaking || this._gapTimer !== null) && !this._isPaused) {
            this._pauseSpeech();
            return;
        }
        if (!this._audio || !this._isPlaying || this._isPaused) return;
        this._audio.pause();
        this._isPaused = true;
        this._isPlaying = false;
        Logger.debug('AudioManager: paused');
    }

    /** Resume paused playback. */
    resume(): void {
        if (this._isPaused && (this._speaking || this._gapPending)) {
            this._resumeSpeech();
            return;
        }
        if (!this._audio || this._isPlaying || !this._isPaused) return;
        this._audio
            .play()
            .then(() => {
                this._isPaused = false;
                this._isPlaying = true;
                Logger.debug('AudioManager: resumed');
            })
            .catch((err: unknown) => {
                Logger.error('AudioManager.resume() failed:', String(err));
                this._emitError(`Resume failed: ${String(err)}`);
            });
    }

    /** Seek to a specific position (seconds). */
    seek(seconds: number): void {
        if (!this._audio) return;
        this._audio.currentTime = seconds;
        Logger.debug(`AudioManager: seeked to ${seconds}s`);
    }

    /** Stop all playback and release resources. */
    stop(): void {
        this._cancelSpeech();
        this._stopCurrentAudio();
        this._cancelPreload();
        this._phase = null;
        this._segmentIndex = 0;
        this._isPlaying = false;
        this._isPaused = false;
        Logger.debug('AudioManager: stopped');
    }

    /** Current playback position in seconds (0 when no audio is loaded). */
    get currentTime(): number {
        return this._audio?.currentTime ?? 0;
    }

    /** Total duration of the current segment in seconds (0 when unknown). */
    get duration(): number {
        const d = this._audio?.duration;
        return d && isFinite(d) ? d : 0;
    }

    /** Returns a snapshot of the current manager state. */
    snapshot(): AudioManagerSnapshot {
        return {
            sessionId: this._sessionId,
            phase: this._phase,
            segmentIndex: this._segmentIndex,
            isPlaying: this._isPlaying,
            isPaused: this._isPaused,
            textOnly: this._textOnly,
        };
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private _hasAudioForSession(sessionId: string): boolean {
        const sessionEntry = MANIFEST[sessionId];
        if (!sessionEntry) return false;
        // At least one phase must have at least one segment mapped
        return Object.values(sessionEntry).some(phase => Object.keys(phase).length > 0);
    }

    private _resolveAudioPath(
        sessionId: string,
        phaseId: PhaseId,
        segmentIndex: number
    ): string | null {
        const path = MANIFEST[sessionId]?.[phaseId]?.[String(segmentIndex)];
        return path ?? null;
    }

    private _playPath(path: string, phaseId: PhaseId, segmentIndex: number): void {
        const audio = new Audio(path);
        this._audio = audio;

        audio.addEventListener('ended', () => {
            // Ignore events from an element that has already been replaced.
            if (this._audio !== audio) return;
            this._isPlaying = false;
            Logger.debug(`AudioManager: segment ended ${phaseId}[${segmentIndex}]`);
            this._onSegmentEnd?.();

            // Check if this was the last segment in the phase by attempting to resolve
            // the next segment. If there is none, emit phaseEnd.
            if (this._sessionId) {
                const nextPath = this._resolveAudioPath(this._sessionId, phaseId, segmentIndex + 1);
                if (!nextPath) {
                    Logger.debug(`AudioManager: phase ended "${phaseId}"`);
                    this._onPhaseEnd?.();
                }
            }
        });

        audio.addEventListener('error', () => {
            // Clearing a finished element (src = '') makes browsers fire `error` on it.
            // That is not a real failure and must not switch the session to text-only.
            if (this._audio !== audio) return;
            const msg = `Failed to load audio: ${path}`;
            Logger.error(`AudioManager: ${msg}`);
            this._isPlaying = false;
            this._textOnly = true;
            this._emitError(msg);
        });

        audio
            .play()
            .then(() => {
                this._isPlaying = true;
                this._isPaused = false;
                Logger.debug(`AudioManager: playing ${phaseId}[${segmentIndex}] — ${path}`);
                // Preload the next segment in the background
                this._schedulePreload(phaseId, segmentIndex + 1);
            })
            .catch((err: unknown) => {
                const msg = `Playback blocked: ${String(err)}`;
                Logger.warn(`AudioManager: ${msg}`);
                this._textOnly = true;
                this._emitError(msg);
            });
    }

    /**
     * Preload the next audio segment (or first segment of the next phase) so it is
     * buffered and ready before it is needed.
     */
    private _schedulePreload(phaseId: PhaseId, nextSegmentIndex: number): void {
        if (!this._sessionId) return;
        this._cancelPreload();

        const path = this._resolveAudioPath(this._sessionId, phaseId, nextSegmentIndex);
        if (!path) return;

        const preload = new Audio();
        preload.preload = 'auto';
        preload.src = path;
        this._preload = preload;
        Logger.debug(`AudioManager: preloading ${phaseId}[${nextSegmentIndex}]`);
    }

    private _startGap(ms: number): void {
        this._gapRemainingMs = ms;
        this._gapStartedAt = Date.now();
        this._gapTimer = setTimeout(() => {
            this._gapTimer = null;
            this._isPlaying = false;
            this._onSegmentEnd?.();
        }, ms);
    }

    private _armWatchdog(fn: () => void, ms: number): void {
        this._clearWatchdog();
        this._watchdog = setTimeout(fn, ms);
    }

    private _clearWatchdog(): void {
        if (this._watchdog !== null) {
            clearTimeout(this._watchdog);
            this._watchdog = null;
        }
    }

    private _pauseSpeech(): void {
        if (this._gapTimer !== null) {
            clearTimeout(this._gapTimer);
            this._gapTimer = null;
            this._gapRemainingMs = Math.max(
                0,
                this._gapRemainingMs - (Date.now() - this._gapStartedAt)
            );
            this._gapPending = true;
        } else if (this._speaking) {
            window.speechSynthesis?.pause();
        }
        this._isPaused = true;
        this._isPlaying = false;
        Logger.debug('AudioManager: paused (device voice)');
    }

    private _resumeSpeech(): void {
        this._isPaused = false;
        this._isPlaying = true;
        if (this._gapPending) {
            this._gapPending = false;
            this._startGap(this._gapRemainingMs);
        } else {
            window.speechSynthesis?.resume();
        }
        Logger.debug('AudioManager: resumed (device voice)');
    }

    /** Cancel any spoken line or silent gap. Stale callbacks are ignored via the token. */
    private _cancelSpeech(): void {
        this._speechToken += 1;
        this._speaking = false;
        this._gapPending = false;
        this._clearWatchdog();
        if (this._gapTimer !== null) {
            clearTimeout(this._gapTimer);
            this._gapTimer = null;
        }
        if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    }

    private _stopCurrentAudio(): void {
        if (!this._audio) return;
        this._audio.pause();
        this._audio.src = '';
        this._audio = null;
        this._isPlaying = false;
        this._isPaused = false;
    }

    private _cancelPreload(): void {
        if (!this._preload) return;
        this._preload.src = '';
        this._preload = null;
    }

    private _emitError(message: string): void {
        try {
            this._onError?.(message);
        } catch (err) {
            Logger.error('AudioManager: onError callback threw:', String(err));
        }
    }
}

/**
 * Singleton instance for use across the session feature.
 * Components that need audio should import this instance directly.
 */
export const audioManager = new AudioManager();
