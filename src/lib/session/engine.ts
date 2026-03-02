/**
 * Session Engine — class-based state machine for self-hypnosis sessions.
 *
 * States: idle → preparation → induction → deepening → suggestion → emergence → complete
 * Driven by a 1-second interval tick via IntervalManager.
 */

import { IntervalManager } from '@utils/helpers';
import { Logger } from '@utils/logger';
import type { PhaseId } from '@/types';
import { PHASE_CONFIG, PHASE_ORDER } from './phaseConfig';

// ─── Public Types ─────────────────────────────────────────────────────────────

export type SessionState = 'idle' | PhaseId | 'complete';

export interface ScriptSegment {
    /** Guidance text shown to the user. */
    text: string;
    /** How many seconds this segment occupies before advancing to the next. */
    durationSeconds: number;
}

export interface PhaseScript {
    /** Override the phase default duration (in minutes). Clamped to phaseConfig min. */
    durationMinutes?: number;
    segments: ScriptSegment[];
}

export interface SessionConfig {
    /** Unique identifier for this session run (UUID). */
    sessionId: string;
    /** Per-phase script overrides.  Omitted phases use phaseConfig defaults. */
    phases?: Partial<Record<PhaseId, PhaseScript>>;
}

export type EngineEventType =
    | 'tick'
    | 'phaseChange'
    | 'segmentChange'
    | 'paused'
    | 'resumed'
    | 'stopped'
    | 'complete';

export interface EngineSnapshot {
    state: SessionState;
    phase: PhaseId | null;
    timeRemaining: number; // seconds remaining in current phase
    segmentIndex: number; // index into current phase segments array
    totalElapsed: number; // total seconds elapsed across all phases
    isRunning: boolean;
    isPaused: boolean;
    phasesCompleted: PhaseId[];
}

export interface EngineEvent extends EngineSnapshot {
    type: EngineEventType;
}

export type EngineListener = (event: EngineEvent) => void;

// ─── Engine ───────────────────────────────────────────────────────────────────

export class SessionEngine {
    private _state: SessionState = 'idle';
    private _currentPhase: PhaseId | null = null;
    private _timeRemaining = 0;
    private _currentSegmentIndex = 0;
    private _segmentElapsed = 0;
    private _totalElapsed = 0;
    private _isRunning = false;
    private _isPaused = false;
    private _phasesCompleted: PhaseId[] = [];
    private _config: SessionConfig | null = null;
    private _intervalId: ReturnType<typeof setInterval> | null = null;
    private _listeners = new Set<EngineListener>();

    // ── Getters ───────────────────────────────────────────────────────────────

    get state(): SessionState {
        return this._state;
    }

    get phase(): PhaseId | null {
        return this._currentPhase;
    }

    get timeRemaining(): number {
        return this._timeRemaining;
    }

    get segmentIndex(): number {
        return this._currentSegmentIndex;
    }

    get totalElapsed(): number {
        return this._totalElapsed;
    }

    get isRunning(): boolean {
        return this._isRunning;
    }

    get isPaused(): boolean {
        return this._isPaused;
    }

    get phasesCompleted(): PhaseId[] {
        return [...this._phasesCompleted];
    }

    snapshot(): EngineSnapshot {
        return {
            state: this._state,
            phase: this._currentPhase,
            timeRemaining: this._timeRemaining,
            segmentIndex: this._currentSegmentIndex,
            totalElapsed: this._totalElapsed,
            isRunning: this._isRunning,
            isPaused: this._isPaused,
            phasesCompleted: [...this._phasesCompleted],
        };
    }

    // ── Event system ──────────────────────────────────────────────────────────

    /**
     * Register a listener.  Returns an unsubscribe function.
     */
    on(listener: EngineListener): () => void {
        this._listeners.add(listener);
        return () => {
            this._listeners.delete(listener);
        };
    }

    private emit(type: EngineEventType): void {
        const event: EngineEvent = { type, ...this.snapshot() };
        this._listeners.forEach(l => {
            try {
                l(event);
            } catch (err) {
                Logger.error('EngineListener threw an error:', String(err));
            }
        });
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Start a new session.  Engine must be in `idle` state.
     */
    start(config: SessionConfig): void {
        if (this._state !== 'idle') {
            Logger.warn('SessionEngine.start() called while not idle — ignored');
            return;
        }

        Logger.info(`Starting session: ${config.sessionId}`);
        this._config = config;
        this._phasesCompleted = [];
        this._totalElapsed = 0;
        this._isRunning = true;
        this._isPaused = false;

        const firstPhase = PHASE_ORDER[0];
        if (firstPhase === undefined) {
            Logger.error('PHASE_ORDER is empty — cannot start session');
            return;
        }

        this._enterPhase(firstPhase);
        this._startInterval();
    }

    /**
     * Skip the current phase (only allowed when `allowSkip` is true for that phase).
     * Emergence phase can never be skipped.
     */
    skip(): void {
        if (!this._isRunning || this._currentPhase === null) {
            Logger.warn('SessionEngine.skip() called while not running — ignored');
            return;
        }

        if (!PHASE_CONFIG[this._currentPhase].allowSkip) {
            Logger.warn(`Phase "${this._currentPhase}" cannot be skipped (safety rule)`);
            return;
        }

        Logger.info(`Skipping phase: ${this._currentPhase}`);
        this._advancePhase();
    }

    /**
     * Pause the session timer.
     */
    pause(): void {
        if (!this._isRunning || this._isPaused) {
            Logger.warn('SessionEngine.pause() called while not pausable — ignored');
            return;
        }

        this._isPaused = true;
        Logger.info('Session paused');
        this.emit('paused');
    }

    /**
     * Resume a paused session.
     */
    resume(): void {
        if (!this._isRunning || !this._isPaused) {
            Logger.warn('SessionEngine.resume() called while not paused — ignored');
            return;
        }

        this._isPaused = false;
        Logger.info('Session resumed');
        this.emit('resumed');
    }

    /**
     * Stop and abandon the current session.  Engine returns to `idle`.
     */
    stop(): void {
        Logger.info('Session stopped by user');
        this._stopInterval();
        this._isRunning = false;
        this._isPaused = false;
        this._state = 'idle';
        this._currentPhase = null;
        this.emit('stopped');
        this._clearSessionState();
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private _clearSessionState(): void {
        this._config = null;
        this._timeRemaining = 0;
        this._currentSegmentIndex = 0;
        this._segmentElapsed = 0;
        this._totalElapsed = 0;
        this._phasesCompleted = [];
    }

    private _enterPhase(phase: PhaseId): void {
        this._currentPhase = phase;
        this._state = phase;
        this._currentSegmentIndex = 0;
        this._segmentElapsed = 0;

        const phaseConf = PHASE_CONFIG[phase];
        const override = this._config?.phases?.[phase];
        const rawMinutes = override?.durationMinutes ?? phaseConf.defaultMinutes;
        // Enforce configured minimum (emergence is never skippable AND has min 2 min)
        const minutes = Math.max(rawMinutes, phaseConf.minMinutes);
        this._timeRemaining = minutes * 60;

        Logger.info(`Entering phase "${phase}" — ${minutes} min`);
        this.emit('phaseChange');
    }

    private _startInterval(): void {
        if (this._intervalId !== null) {
            IntervalManager.clear(this._intervalId);
        }
        this._intervalId = IntervalManager.register(() => this._tick(), 1000);
    }

    private _stopInterval(): void {
        if (this._intervalId !== null) {
            IntervalManager.clear(this._intervalId);
            this._intervalId = null;
        }
    }

    private _tick(): void {
        if (!this._isRunning || this._isPaused) return;

        this._totalElapsed += 1;
        this._timeRemaining = Math.max(0, this._timeRemaining - 1);
        this._segmentElapsed += 1;

        // Advance to next segment when the current segment's duration has elapsed
        if (this._currentPhase !== null) {
            const segments = this._config?.phases?.[this._currentPhase]?.segments;
            if (segments && segments.length > 0) {
                const current = segments[this._currentSegmentIndex];
                if (current !== undefined && this._segmentElapsed >= current.durationSeconds) {
                    const nextIndex = this._currentSegmentIndex + 1;
                    if (nextIndex < segments.length) {
                        this._currentSegmentIndex = nextIndex;
                        this._segmentElapsed = 0;
                        this.emit('segmentChange');
                    }
                }
            }
        }

        this.emit('tick');

        if (this._timeRemaining <= 0) {
            this._advancePhase();
        }
    }

    private _advancePhase(): void {
        if (this._currentPhase === null) return;

        const completed = this._currentPhase;
        this._phasesCompleted = [...this._phasesCompleted, completed];
        Logger.info(`Phase completed: ${completed}`);

        const idx = PHASE_ORDER.indexOf(completed);
        const next = PHASE_ORDER[idx + 1];

        if (next !== undefined) {
            this._enterPhase(next);
        } else {
            this._finishSession();
        }
    }

    private _finishSession(): void {
        this._stopInterval();
        this._isRunning = false;
        this._currentPhase = null;
        this._state = 'complete';
        Logger.info('Session complete');
        this.emit('complete');
    }
}
