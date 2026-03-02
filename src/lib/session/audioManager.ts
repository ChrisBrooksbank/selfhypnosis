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

// ─── Manifest Types ────────────────────────────────────────────────────────────

/**
 * Shape of src/content/audio/manifest.json.
 * { [sessionId]: { [phaseId]: { [segmentIndex]: filePath } } }
 */
type AudioManifest = Record<string, Record<string, Record<string, string>>>;

// Loaded at module level — static JSON, available before any instances are created.
// The cast is safe: JSON files have no prototype chain concerns.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MANIFEST: AudioManifest = require('@/content/audio/manifest.json') as AudioManifest;

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
            Logger.debug(
                `AudioManager: no audio for ${phaseId}[${segmentIndex}] — text-only fallback`
            );
            this._textOnly = true;
            return;
        }

        this._stopCurrentAudio();
        this._playPath(path, phaseId, segmentIndex);
    }

    /** Pause current playback. */
    pause(): void {
        if (!this._audio || !this._isPlaying || this._isPaused) return;
        this._audio.pause();
        this._isPaused = true;
        this._isPlaying = false;
        Logger.debug('AudioManager: paused');
    }

    /** Resume paused playback. */
    resume(): void {
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
