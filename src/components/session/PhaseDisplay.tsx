'use client';

/**
 * PhaseDisplay — 5-phase stepper bar showing session progress.
 *
 * - All 5 phases displayed as compact steps.
 * - Current phase highlighted with active colour.
 * - Completed phases marked with a check indicator.
 */

import type { PhaseId } from '@/types/index';

const PHASES: PhaseId[] = ['preparation', 'induction', 'deepening', 'suggestion', 'emergence'];

const PHASE_LABELS: Record<PhaseId, string> = {
    preparation: 'Prep',
    induction: 'Induction',
    deepening: 'Deepening',
    suggestion: 'Suggestion',
    emergence: 'Emergence',
};

export interface PhaseDisplayProps {
    /** The currently active phase. */
    currentPhase: PhaseId;
    /** Phases that have been completed. Defaults to all phases before currentPhase. */
    completedPhases?: PhaseId[];
}

function getStatus(
    phase: PhaseId,
    currentPhase: PhaseId,
    completedPhases: PhaseId[]
): 'completed' | 'active' | 'upcoming' {
    if (completedPhases.includes(phase)) return 'completed';
    if (phase === currentPhase) return 'active';
    return 'upcoming';
}

export function PhaseDisplay({ currentPhase, completedPhases }: PhaseDisplayProps) {
    const currentIndex = PHASES.indexOf(currentPhase);
    const resolved = completedPhases ?? PHASES.slice(0, currentIndex);

    return (
        <div
            className="flex w-full items-center justify-between px-2"
            role="progressbar"
            aria-label="Session phases"
            aria-valuenow={currentIndex + 1}
            aria-valuemin={1}
            aria-valuemax={PHASES.length}
        >
            {PHASES.map((phase, i) => {
                const status = getStatus(phase, currentPhase, resolved);
                const isLast = i === PHASES.length - 1;

                return (
                    <div key={phase} className="flex flex-1 flex-col items-center">
                        <div className="flex w-full items-center">
                            {/* Connector line before */}
                            {i > 0 && (
                                <div
                                    className={`h-0.5 flex-1 transition-colors duration-300 ${
                                        status === 'upcoming' ? 'bg-white/20' : 'bg-indigo-400'
                                    }`}
                                    aria-hidden="true"
                                />
                            )}

                            {/* Step circle */}
                            <div
                                className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                                    status === 'active'
                                        ? 'bg-indigo-400 ring-2 ring-indigo-300 ring-offset-1 ring-offset-transparent'
                                        : status === 'completed'
                                          ? 'bg-indigo-500'
                                          : 'bg-white/20'
                                }`}
                                aria-hidden="true"
                            >
                                {status === 'completed' ? (
                                    <svg
                                        className="h-3 w-3 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={3}
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                ) : (
                                    <span
                                        className={`text-xs font-semibold ${
                                            status === 'active' ? 'text-white' : 'text-white/50'
                                        }`}
                                    >
                                        {i + 1}
                                    </span>
                                )}
                            </div>

                            {/* Connector line after */}
                            {!isLast && (
                                <div
                                    className={`h-0.5 flex-1 transition-colors duration-300 ${
                                        status === 'completed' ? 'bg-indigo-400' : 'bg-white/20'
                                    }`}
                                    aria-hidden="true"
                                />
                            )}
                        </div>

                        {/* Label below circle */}
                        <span
                            className={`mt-1 text-center text-[10px] leading-tight transition-colors duration-300 ${
                                status === 'active'
                                    ? 'font-semibold text-indigo-300'
                                    : status === 'completed'
                                      ? 'text-indigo-400'
                                      : 'text-white/40'
                            }`}
                        >
                            {PHASE_LABELS[phase]}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
