'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useSessionEngine } from '@hooks/useSessionEngine';
import { AudioPlayer } from '@components/session/AudioPlayer';
import { PhaseDisplay } from '@components/session/PhaseDisplay';
import { PhaseTimer } from '@components/session/PhaseTimer';
import { ScriptDisplay } from '@components/session/ScriptDisplay';
import { SessionSummary } from '@components/session/SessionSummary';
import { audioManager } from '@lib/session/audioManager';
import { PHASE_CONFIG } from '@lib/session/phaseConfig';
import type { PhaseScript, SessionConfig } from '@lib/session/engine';
import { db, type CustomSuggestion } from '@lib/db';
import { getGuidedSession } from '@/content/sessions';
import type { GoalArea, GuidedSession, PhaseId } from '@/types';
import { Logger } from '@utils/logger';

// Default guidance text shown when no guided session script is loaded.
const DEFAULT_SEGMENT_TEXT: Record<PhaseId, string> = {
    preparation: 'Find a comfortable position. Close your eyes and begin to relax.',
    induction: 'Take a deep breath in… and slowly exhale. With each breath, you sink deeper.',
    deepening: 'You are becoming more deeply relaxed with every moment that passes.',
    suggestion: 'You are open to positive change, feeling calm and at peace.',
    emergence: 'Slowly begin to return to full awareness. Wiggle your fingers and toes gently.',
};

/** Seconds each personal suggestion is shown for during the suggestion phase. */
const PERSONAL_SUGGESTION_SECONDS = 30;
/** Maximum number of personal suggestions woven into one session. */
const MAX_PERSONAL_SUGGESTIONS = 3;

function buildConfig(
    sessionId: string,
    template: GuidedSession | undefined,
    personal: CustomSuggestion[]
): SessionConfig {
    if (!template) return { sessionId, type: 'guided' };

    const phases: Partial<Record<PhaseId, PhaseScript>> = {};
    for (const [phaseId, phase] of Object.entries(template.phases) as [
        PhaseId,
        GuidedSession['phases'][PhaseId],
    ][]) {
        phases[phaseId] = { durationMinutes: phase.durationMinutes, segments: phase.segments };
    }

    // Weave the user's own suggestions for this goal into the suggestion phase,
    // just before its closing segment, and lengthen the phase to fit them.
    const suggestionPhase = phases.suggestion;
    if (suggestionPhase && personal.length > 0) {
        const extra = personal.map(p => ({
            text: p.text,
            durationSeconds: PERSONAL_SUGGESTION_SECONDS,
        }));
        const segments = [...suggestionPhase.segments];
        segments.splice(Math.max(0, segments.length - 1), 0, ...extra);
        const totalSeconds = segments.reduce((sum, seg) => sum + seg.durationSeconds, 0);
        phases.suggestion = {
            segments,
            durationMinutes: Math.max(
                suggestionPhase.durationMinutes ?? 0,
                Math.ceil(totalSeconds / 60)
            ),
        };
    }

    return {
        sessionId,
        type: 'guided',
        templateId: template.id,
        goalArea: template.goalArea,
        techniquesUsed: template.techniquesUsed,
        plannedDurationMinutes: template.estimatedMinutes,
        suggestionIds: personal.map(p => p.id),
        phases,
    };
}

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
        if (!config || sessionStarted.current) return;
        sessionStarted.current = true;
        start(config);
    }, [config, start]);

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

    // Show the post-session summary when the session completes.
    useEffect(() => {
        if (hasBeenRunning.current && !isRunning && phase === null) {
            setIsComplete(true);
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
