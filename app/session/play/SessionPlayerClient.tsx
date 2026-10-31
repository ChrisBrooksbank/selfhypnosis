'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useSessionEngine } from '@hooks/useSessionEngine';
import { useWakeLock } from '@hooks/useWakeLock';
import { AudioPlayer } from '@components/session/AudioPlayer';
import { PhaseDisplay } from '@components/session/PhaseDisplay';
import { PhaseTimer } from '@components/session/PhaseTimer';
import { ScriptDisplay } from '@components/session/ScriptDisplay';
import { SessionSummary } from '@components/session/SessionSummary';
import { audioManager } from '@lib/session/audioManager';
import { playChime } from '@lib/session/chime';
import { PHASE_CONFIG } from '@lib/session/phaseConfig';
import type { SessionConfig } from '@lib/session/engine';
import { buildConfig } from '@lib/session/sessionConfig';
import { db, type CustomSuggestion } from '@lib/db';
import { getGuidedSession } from '@/content/sessions';
import type { GoalArea, PhaseId } from '@/types';
import { Logger } from '@utils/logger';

// Default guidance text shown when no guided session script is loaded.
const DEFAULT_SEGMENT_TEXT: Record<PhaseId, string> = {
    preparation: 'Find a comfortable position. Close your eyes and begin to relax.',
    induction: 'Take a deep breath in… and slowly exhale. With each breath, you sink deeper.',
    deepening: 'You are becoming more deeply relaxed with every moment that passes.',
    suggestion: 'You are open to positive change, feeling calm and at peace.',
    emergence: 'Slowly begin to return to full awareness. Wiggle your fingers and toes gently.',
};

/** Maximum number of personal suggestions woven into one session. */
const MAX_PERSONAL_SUGGESTIONS = 3;
/** Seconds of inactivity before the screen fades to near-black for eyes-closed use. */
const DIM_AFTER_SECONDS = 10;

/** The user's best suggestions for a goal: favourites first, then highest scoring. */
async function loadPersonalSuggestions(
    goalArea: GoalArea | undefined
): Promise<CustomSuggestion[]> {
    if (!goalArea) return [];
    const all = await db.suggestions.where('goalArea').equals(goalArea).toArray();
    return all
        .sort(
            (a, b) =>
                Number(b.isFavourite) - Number(a.isFavourite) ||
                b.validationScore - a.validationScore
        )
        .slice(0, MAX_PERSONAL_SUGGESTIONS);
}

/** Record which personal suggestions a session used, and bump their usage counts. */
async function recordSuggestionUsage(sessionId: string, suggestions: CustomSuggestion[]) {
    if (suggestions.length === 0) return;
    const now = new Date().toISOString();
    await db.transaction('rw', db.sessions, db.suggestions, async () => {
        await db.sessions.update(sessionId, { suggestionIds: suggestions.map(s => s.id) });
        for (const s of suggestions) {
            await db.suggestions.update(s.id, { usageCount: s.usageCount + 1, lastUsedAt: now });
        }
    });
}

/** Phase length in seconds, matching the engine's clamping rules. */
function phaseSeconds(phase: PhaseId, config: SessionConfig | null): number {
    const conf = PHASE_CONFIG[phase];
    const minutes = config?.phases?.[phase]?.durationMinutes ?? conf.defaultMinutes;
    return Math.max(minutes, conf.minMinutes) * 60;
}

interface Props {
    sessionId: string;
}

export function SessionPlayerClient({ sessionId }: Props) {
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

    const [config, setConfig] = useState<SessionConfig | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    // Nothing starts until the user taps Begin: browsers only allow audio after a gesture.
    const [began, setBegan] = useState(false);
    const [dimmed, setDimmed] = useState(false);
    const sessionStarted = useRef(false);
    const hasBeenRunning = useRef(false);

    // Set data-fullscreen on <html> to hide BottomNav while on this page.
    useEffect(() => {
        document.documentElement.setAttribute('data-fullscreen', '');
        return () => {
            document.documentElement.removeAttribute('data-fullscreen');
        };
    }, []);

    // Resolve the session record created by the launcher, and its guided script.
    useEffect(() => {
        let cancelled = false;
        async function load() {
            const record = await db.sessions.get(sessionId);
            const template = getGuidedSession(record?.templateId);
            const personal = template ? await loadPersonalSuggestions(template.goalArea) : [];
            if (cancelled) return;
            setConfig(buildConfig(sessionId, template, personal));
            recordSuggestionUsage(sessionId, personal).catch((err: unknown) => {
                Logger.error('Failed to record suggestion usage:', String(err));
            });
        }
        load().catch((err: unknown) => {
            Logger.error('Failed to load session record:', String(err));
            if (!cancelled) setConfig(buildConfig(sessionId, undefined, []));
        });
        return () => {
            cancelled = true;
        };
    }, [sessionId]);

    // Start the session engine once the config is ready.
    useEffect(() => {
        if (!config || !began || sessionStarted.current) return;
        sessionStarted.current = true;
        start(config);
    }, [config, began, start]);

    // Keep the screen awake for the duration of the session.
    useWakeLock(began && !isComplete);

    // Fade the screen to near-black after a period of inactivity; any tap wakes it.
    useEffect(() => {
        if (!began || isComplete) return;
        const id = window.setTimeout(() => setDimmed(true), DIM_AFTER_SECONDS * 1000);
        return () => window.clearTimeout(id);
    }, [began, isComplete, dimmed]);

    // Load audio for this session; enable audio mode if audio is available.
    // Cleanup stops audio when the page unmounts.
    useEffect(() => {
        if (!config) return;
        audioManager.loadSession(config.templateId ?? sessionId);
        if (!audioManager.snapshot().textOnly) {
            setAudioMode(true);
        }
        return () => {
            audioManager.stop();
        };
    }, [config, sessionId, setAudioMode]);

    // Wire audio segment-end callback to the engine's external advance method.
    // If audio genuinely fails, hand segment timing back to the engine's timer so the
    // script keeps moving (text-only) instead of freezing on one line.
    useEffect(() => {
        audioManager.onSegmentEnd = advanceSegmentFromAudio;
        audioManager.onError = () => setAudioMode(false);
    }, [advanceSegmentFromAudio, setAudioMode]);

    // Play the current segment's audio whenever phase or segment changes.
    // Recorded segments play their own clip (by audioIndex, which survives personal
    // suggestions shifting positions); text with no recording is spoken by the device voice.
    useEffect(() => {
        if (!phase || !isRunning) return;
        if (audioManager.snapshot().textOnly) return;
        const segs = config?.phases?.[phase]?.segments;
        const seg = segs?.[Math.min(segment, (segs?.length ?? 1) - 1)];
        if (!seg) return;
        if (seg.audioIndex !== undefined) {
            audioManager.playSegment(phase, seg.audioIndex);
        } else {
            audioManager.speak(seg.text);
        }
    }, [phase, segment, isRunning, config]);

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

    // Show the post-session summary when the session completes.
    useEffect(() => {
        if (hasBeenRunning.current && !isRunning && phase === null) {
            setIsComplete(true);
            playChime();
        }
    }, [isRunning, phase]);

    // Jump to emergence: skip all preceding phases (engine ignores skips on emergence).
    const handleEmergencyExit = useCallback(() => {
        for (let i = 0; i < 4; i++) {
            skip();
        }
    }, [skip]);

    const totalSeconds = useMemo(() => (phase ? phaseSeconds(phase, config) : 0), [phase, config]);
    const segments = phase ? config?.phases?.[phase]?.segments : undefined;
    const currentText = phase
        ? (segments?.[Math.min(segment, segments.length - 1)]?.text ?? DEFAULT_SEGMENT_TEXT[phase])
        : '';
    const isEmergence = phase === 'emergence';

    if (isComplete) {
        return (
            <div className="fixed inset-0 z-40 overflow-y-auto bg-white">
                <div className="mx-auto max-w-lg">
                    <SessionSummary sessionId={sessionId} />
                </div>
            </div>
        );
    }

    // Start screen: one huge target, easy to hit before closing your eyes.
    if (!began) {
        return (
            <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-gray-950 px-6 text-center text-white">
                <p className="max-w-xs text-lg text-gray-300">
                    Get comfortable. Turn your volume up a little, then tap to begin. The screen
                    will fade and a calm voice will guide you.
                </p>
                <button
                    onClick={() => setBegan(true)}
                    disabled={!config}
                    aria-label="Begin session"
                    className="flex h-48 w-48 items-center justify-center rounded-full bg-indigo-600 text-2xl font-medium shadow-lg hover:bg-indigo-500 active:scale-95 disabled:opacity-40"
                >
                    {config ? 'Begin' : 'Loading…'}
                </button>
                <button
                    onClick={() => router.push('/session')}
                    className="text-sm text-gray-500 underline hover:text-gray-300"
                >
                    Back to sessions
                </button>
            </div>
        );
    }

    // Loading state before first phase fires.
    if (!phase) {
        return (
            <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-gray-950">
                <p className="text-gray-400">Loading session…</p>
                <button
                    onClick={() => router.push('/session')}
                    className="text-sm text-gray-500 underline hover:text-gray-300"
                >
                    Back to sessions
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-40 flex flex-col bg-gray-950 text-white">
            {/* Dim overlay: swallows the first tap so a wake-up tap never hits a control. */}
            <div
                onPointerDown={() => setDimmed(false)}
                aria-hidden={!dimmed}
                className={`absolute inset-0 z-50 bg-black transition-opacity duration-[2000ms] ${
                    dimmed ? 'opacity-95' : 'pointer-events-none opacity-0'
                }`}
            />

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
            <div className="flex flex-col gap-3 px-6 pb-10" onPointerDown={() => setDimmed(false)}>
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
                        className="flex-1 rounded-xl bg-indigo-600 py-6 text-xl font-medium text-white hover:bg-indigo-500 disabled:opacity-40"
                    >
                        {isPaused ? 'Resume' : 'Pause'}
                    </button>
                </div>

                {!isEmergence && (
                    <button
                        onClick={handleEmergencyExit}
                        disabled={!isRunning}
                        className="w-full rounded-xl bg-red-900/60 py-8 text-xl font-medium text-red-200 hover:bg-red-900/80 disabled:opacity-40"
                    >
                        Emergency Exit → Emergence
                    </button>
                )}
            </div>
        </div>
    );
}
