'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { db } from '@lib/db';
import { useOnboardingStatus } from '@hooks/useOnboardingStatus';
import { Logger } from '@utils/logger';
import type { GuidedSession, GoalArea, TechniqueId } from '@/types';

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

    const handleLaunch = useCallback(
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

    return (
        <div className="flex flex-col gap-4">
            {isDisabled && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    Sessions are disabled due to your safety assessment. Please consult a healthcare
                    professional before using self-hypnosis.
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
                                onClick={() => void handleLaunch(session)}
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
    );
}
