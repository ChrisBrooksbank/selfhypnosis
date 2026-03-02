/**
 * useSessionEngine — React wrapper around the SessionEngine state machine.
 *
 * Returns reactive state synced from engine events, plus bound action methods.
 * Also detects interrupted sessions (started but not completed) on mount.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { SessionEngine, type EngineSnapshot, type SessionConfig } from '@lib/session/engine';
import { db, type SessionRecord } from '@lib/db';
import type { PhaseId } from '@/types';
import { Logger } from '@utils/logger';

export interface SessionEngineState {
    phase: PhaseId | null;
    timeRemaining: number;
    segment: number;
    totalElapsed: number;
    isRunning: boolean;
    isPaused: boolean;
    interruptedSession: SessionRecord | null;
}

export interface UseSessionEngineReturn extends SessionEngineState {
    start: (config: SessionConfig) => void;
    skip: () => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
    discardInterrupted: () => Promise<void>;
    /** Enable or disable audio-driven segment advance. */
    setAudioMode: (enabled: boolean) => void;
    /** Advance the current segment, called by the audio manager on segment end. */
    advanceSegmentFromAudio: () => void;
}

function snapshotToState(
    snapshot: EngineSnapshot,
    interruptedSession: SessionRecord | null
): SessionEngineState {
    return {
        phase: snapshot.phase,
        timeRemaining: snapshot.timeRemaining,
        segment: snapshot.segmentIndex,
        totalElapsed: snapshot.totalElapsed,
        isRunning: snapshot.isRunning,
        isPaused: snapshot.isPaused,
        interruptedSession,
    };
}

const INITIAL_STATE: SessionEngineState = {
    phase: null,
    timeRemaining: 0,
    segment: 0,
    totalElapsed: 0,
    isRunning: false,
    isPaused: false,
    interruptedSession: null,
};

export function useSessionEngine(): UseSessionEngineReturn {
    const engineRef = useRef<SessionEngine | null>(null);

    if (engineRef.current === null) {
        engineRef.current = new SessionEngine();
    }

    const [state, setState] = useState<SessionEngineState>(INITIAL_STATE);
    const interruptedSessionRef = useRef<SessionRecord | null>(null);

    // Detect interrupted sessions on mount
    useEffect(() => {
        let cancelled = false;

        db.sessions
            .filter(s => !s.completedAt && !s.interruptedAt)
            .first()
            .then(record => {
                if (cancelled) return;
                const interrupted = record ?? null;
                interruptedSessionRef.current = interrupted;
                if (interrupted) {
                    Logger.info(
                        `Interrupted session detected: ${interrupted.id} (started ${interrupted.startedAt})`
                    );
                }
                setState(prev => ({ ...prev, interruptedSession: interrupted }));
            })
            .catch(err => {
                if (cancelled) return;
                Logger.error('Failed to check for interrupted sessions', err);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const engine = engineRef.current;
        if (engine === null) return;

        const unsubscribe = engine.on(event => {
            setState(prev =>
                snapshotToState(event, interruptedSessionRef.current ?? prev.interruptedSession)
            );
        });

        return unsubscribe;
    }, []);

    const start = useCallback((config: SessionConfig) => {
        engineRef.current?.start(config);
    }, []);

    const skip = useCallback(() => {
        engineRef.current?.skip();
    }, []);

    const pause = useCallback(() => {
        engineRef.current?.pause();
    }, []);

    const resume = useCallback(() => {
        engineRef.current?.resume();
    }, []);

    const stop = useCallback(() => {
        engineRef.current?.stop();
    }, []);

    const setAudioMode = useCallback((enabled: boolean) => {
        engineRef.current?.setAudioMode(enabled);
    }, []);

    const advanceSegmentFromAudio = useCallback(() => {
        engineRef.current?.advanceSegmentFromAudio();
    }, []);

    const discardInterrupted = useCallback(async () => {
        const interrupted = interruptedSessionRef.current;
        if (!interrupted) return;

        try {
            await db.sessions.update(interrupted.id, {
                interruptedAt: new Date().toISOString(),
            });
            interruptedSessionRef.current = null;
            setState(prev => ({ ...prev, interruptedSession: null }));
            Logger.info(`Interrupted session discarded: ${interrupted.id}`);
        } catch (err) {
            Logger.error('Failed to discard interrupted session', err);
        }
    }, []);

    return {
        ...state,
        start,
        skip,
        pause,
        resume,
        stop,
        discardInterrupted,
        setAudioMode,
        advanceSegmentFromAudio,
    };
}
