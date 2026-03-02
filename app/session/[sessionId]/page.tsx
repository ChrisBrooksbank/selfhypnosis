'use client';

import { use, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { useSessionEngine } from '@hooks/useSessionEngine';
import { AudioPlayer } from '@components/session/AudioPlayer';
import { PhaseDisplay } from '@components/session/PhaseDisplay';
import { PhaseTimer } from '@components/session/PhaseTimer';
import { ScriptDisplay } from '@components/session/ScriptDisplay';
import { audioManager } from '@lib/session/audioManager';
import { PHASE_CONFIG } from '@lib/session/phaseConfig';
import type { PhaseId } from '@/types';

// Default guidance text shown when no guided session script is loaded.
const DEFAULT_SEGMENT_TEXT: Record<PhaseId, string> = {
    preparation: 'Find a comfortable position. Close your eyes and begin to relax.',
    induction: 'Take a deep breath in… and slowly exhale. With each breath, you sink deeper.',
    deepening: 'You are becoming more deeply relaxed with every moment that passes.',
    suggestion: 'You are open to positive change, feeling calm and at peace.',
    emergence: 'Slowly begin to return to full awareness. Wiggle your fingers and toes gently.',
};

export function generateStaticParams() {
    // Session IDs are runtime UUIDs stored in IndexedDB.
    // A placeholder is exported so the static build succeeds; real navigation is client-side.
    return [{ sessionId: 'placeholder' }];
}

interface Props {
    params: Promise<{ sessionId: string }>;
}

export default function SessionPlayerPage({ params }: Props) {
    const { sessionId } = use(params);
    const router = useRouter();

    const {
        phase,
        timeRemaining,
        segment,
        isRunning,
        isPaused,
        start,
        skip,
        pause,
        resume,
        setAudioMode,
        advanceSegmentFromAudio,
    } = useSessionEngine();

    const sessionStarted = useRef(false);
    const hasBeenRunning = useRef(false);

    // Set data-fullscreen on <html> to hide BottomNav while on this page.
    useEffect(() => {
        document.documentElement.setAttribute('data-fullscreen', '');
        return () => {
            document.documentElement.removeAttribute('data-fullscreen');
        };
    }, []);

    // Start the session engine once on mount.
    useEffect(() => {
        if (sessionStarted.current) return;
        sessionStarted.current = true;
        start({ sessionId, type: 'guided' });
    }, [sessionId, start]);

    // Load audio for this session; enable audio mode if audio is available.
    // Cleanup stops audio when the page unmounts.
    useEffect(() => {
        audioManager.loadSession(sessionId);
        if (!audioManager.snapshot().textOnly) {
            setAudioMode(true);
        }
        return () => {
            audioManager.stop();
        };
    }, [sessionId, setAudioMode]);

    // Wire audio segment-end callback to the engine's external advance method.
    useEffect(() => {
        audioManager.onSegmentEnd = advanceSegmentFromAudio;
    }, [advanceSegmentFromAudio]);

    // Play the current segment's audio whenever phase or segment changes.
    useEffect(() => {
        if (!phase || !isRunning) return;
        if (!audioManager.snapshot().textOnly) {
            audioManager.playSegment(phase, segment);
        }
    }, [phase, segment, isRunning]);

    // Sync audio pause/resume with the engine's paused state.
    useEffect(() => {
        if (!isRunning) return;
        if (isPaused) {
            audioManager.pause();
        } else {
            audioManager.resume();
        }
    }, [isPaused, isRunning]);

    // Track when the session has started running so we can detect completion.
    useEffect(() => {
        if (isRunning) {
            hasBeenRunning.current = true;
        }
    }, [isRunning]);

    // Navigate to session list when the session completes.
    useEffect(() => {
        if (hasBeenRunning.current && !isRunning && phase === null) {
            router.push('/session');
        }
    }, [isRunning, phase, router]);

    // Jump to emergence: skip all preceding phases (engine ignores skips on emergence).
    const handleEmergencyExit = useCallback(() => {
        for (let i = 0; i < 4; i++) {
            skip();
        }
    }, [skip]);

    const totalSeconds = phase ? PHASE_CONFIG[phase].defaultMinutes * 60 : 0;
    const currentText = phase ? DEFAULT_SEGMENT_TEXT[phase] : '';
    const isEmergence = phase === 'emergence';

    // Loading state before first phase fires.
    if (!phase) {
        return (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-950">
                <p className="text-gray-400">Loading session…</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-40 flex flex-col bg-gray-950 text-white">
            {/* Phase stepper */}
            <div className="px-4 pt-10">
                <PhaseDisplay currentPhase={phase} />
            </div>

            {/* Central content: timer + script */}
            <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6">
                <PhaseTimer
                    phase={phase}
                    timeRemaining={timeRemaining}
                    totalSeconds={totalSeconds}
                    size={200}
                />
                <div className="w-full max-w-sm">
                    <ScriptDisplay text={currentText} segmentIndex={segment} />
                </div>
            </div>

            {/* Audio player — hidden automatically when no audio is available */}
            <div className="px-6">
                <AudioPlayer />
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-3 px-6 pb-10">
                <div className="flex gap-3">
                    {!isEmergence && (
                        <button
                            onClick={skip}
                            disabled={!isRunning}
                            className="flex-1 rounded-xl bg-white/10 py-3 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-40"
                        >
                            Skip Phase
                        </button>
                    )}
                    <button
                        onClick={isPaused ? resume : pause}
                        disabled={!isRunning}
                        className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40"
                    >
                        {isPaused ? 'Resume' : 'Pause'}
                    </button>
                </div>

                {!isEmergence && (
                    <button
                        onClick={handleEmergencyExit}
                        disabled={!isRunning}
                        className="w-full rounded-xl bg-red-900/40 py-3 text-sm font-medium text-red-300 hover:bg-red-900/60 disabled:opacity-40"
                    >
                        Emergency Exit → Emergence
                    </button>
                )}
            </div>
        </div>
    );
}
