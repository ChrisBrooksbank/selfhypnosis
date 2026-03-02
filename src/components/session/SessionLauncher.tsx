'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { db } from '@lib/db';
import { useOnboardingStatus } from '@hooks/useOnboardingStatus';
import { Logger } from '@utils/logger';
import type { GuidedSession, GoalArea, TechniqueId } from '@/types';

const PAIN_WARNING_KEY = 'painWarningAcknowledged';

interface SessionLauncherProps {
    sessions: GuidedSession[];
}

const goalAreaLabels: Record<GoalArea, string> = {
    'stress-anxiety': 'Stress & Anxiety',
    pain: 'Pain',
    sleep: 'Sleep',
    habits: 'Habits',
    performance: 'Performance',
    ibs: 'IBS',
    childbirth: 'Childbirth',
    'general-relaxation': 'Relaxation',
};

const techniqueLabels: Record<TechniqueId, string> = {
    'eye-fixation': 'Eye Fixation',
    pmr: 'PMR',
    visualisation: 'Visualisation',
    countdown: 'Countdown',
    breathing: 'Breathing',
    '321-sensory': '3-2-1 Sensory',
    autogenic: 'Autogenic',
};

const difficultyConfig = {
    beginner: { label: 'Beginner', className: 'bg-green-100 text-green-700' },
    intermediate: { label: 'Intermediate', className: 'bg-yellow-100 text-yellow-700' },
    advanced: { label: 'Advanced', className: 'bg-red-100 text-red-700' },
} as const;

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function SessionLauncher({ sessions }: SessionLauncherProps) {
    const router = useRouter();
    const { riskLevel } = useOnboardingStatus();
    const isDisabled = riskLevel === 'red';
    const [pendingPainSession, setPendingPainSession] = useState<GuidedSession | null>(null);

    const launchSession = useCallback(
        async (session: GuidedSession) => {
            if (isDisabled) return;

            const id = generateId();
            const now = new Date().toISOString();

            try {
                await db.sessions.add({
                    id,
                    startedAt: now,
                    type: 'guided',
                    templateId: session.id,
                    goalArea: session.goalArea,
                    techniquesUsed: session.techniquesUsed,
                    plannedDurationMinutes: session.estimatedMinutes,
                    phasesCompleted: [],
                    suggestionIds: [],
                });

                Logger.info(`Session record created: ${id} (${session.id})`);
                router.push(`/session/${id}`);
            } catch (err) {
                Logger.error('Failed to create session record');
                Logger.error(String(err));
            }
        },
        [isDisabled, router]
    );

    const handleLaunch = useCallback(
        (session: GuidedSession) => {
            if (isDisabled) return;

            if (session.goalArea === 'pain' && !localStorage.getItem(PAIN_WARNING_KEY)) {
                setPendingPainSession(session);
                return;
            }

            void launchSession(session);
        },
        [isDisabled, launchSession]
    );

    const handlePainWarningConfirm = useCallback(() => {
        localStorage.setItem(PAIN_WARNING_KEY, '1');
        const session = pendingPainSession;
        setPendingPainSession(null);
        if (session) void launchSession(session);
    }, [pendingPainSession, launchSession]);

    const handlePainWarningDismiss = useCallback(() => {
        setPendingPainSession(null);
    }, []);

    return (
        <>
            {pendingPainSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="mb-3 text-lg font-semibold text-gray-900">
                            Pain Sessions — Medical Notice
                        </h2>
                        <p className="mb-6 text-sm text-gray-700">
                            Pain can be a symptom of underlying conditions. Please ensure you have a
                            medical diagnosis before using self-hypnosis for pain management.
                            Self-hypnosis is a complementary approach and does not replace
                            professional medical care.
                        </p>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handlePainWarningConfirm}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                            >
                                I understand — Continue
                            </button>
                            <button
                                onClick={handlePainWarningDismiss}
                                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-4">
                {isDisabled && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        Sessions are disabled due to your safety assessment. Please consult a
                        healthcare professional before using self-hypnosis.
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {sessions.map(session => {
                        const difficulty = difficultyConfig[session.difficulty];

                        return (
                            <div
                                key={session.id}
                                className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <h2 className="text-base font-semibold text-gray-900">
                                        {session.name}
                                    </h2>
                                    <span
                                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${difficulty.className}`}
                                    >
                                        {difficulty.label}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-600">{session.description}</p>

                                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
                                        {goalAreaLabels[session.goalArea]}
                                    </span>
                                    <span>{session.estimatedMinutes} min</span>
                                </div>

                                <div className="flex flex-wrap gap-1">
                                    {session.techniquesUsed.map(tid => (
                                        <span
                                            key={tid}
                                            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                                        >
                                            {techniqueLabels[tid]}
                                        </span>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleLaunch(session)}
                                    disabled={isDisabled}
                                    className="mt-auto rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Start Session
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
