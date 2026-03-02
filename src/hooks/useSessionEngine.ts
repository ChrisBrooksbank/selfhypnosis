/**
 * useSessionEngine — React wrapper around the SessionEngine state machine.
 *
 * Returns reactive state synced from engine events, plus bound action methods.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { SessionEngine, type EngineSnapshot, type SessionConfig } from '@lib/session/engine';
import type { PhaseId } from '@/types';

export interface SessionEngineState {
    phase: PhaseId | null;
    timeRemaining: number;
    segment: number;
    totalElapsed: number;
    isRunning: boolean;
    isPaused: boolean;
}

export interface UseSessionEngineReturn extends SessionEngineState {
    start: (config: SessionConfig) => void;
    skip: () => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
}

function snapshotToState(snapshot: EngineSnapshot): SessionEngineState {
    return {
        phase: snapshot.phase,
        timeRemaining: snapshot.timeRemaining,
        segment: snapshot.segmentIndex,
        totalElapsed: snapshot.totalElapsed,
        isRunning: snapshot.isRunning,
        isPaused: snapshot.isPaused,
    };
}

const INITIAL_STATE: SessionEngineState = {
    phase: null,
    timeRemaining: 0,
    segment: 0,
    totalElapsed: 0,
    isRunning: false,
    isPaused: false,
};

export function useSessionEngine(): UseSessionEngineReturn {
    const engineRef = useRef<SessionEngine | null>(null);

    if (engineRef.current === null) {
        engineRef.current = new SessionEngine();
    }

    const [state, setState] = useState<SessionEngineState>(INITIAL_STATE);

    useEffect(() => {
        const engine = engineRef.current;
        if (engine === null) return;

        const unsubscribe = engine.on(event => {
            setState(snapshotToState(event));
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

    return { ...state, start, skip, pause, resume, stop };
}
