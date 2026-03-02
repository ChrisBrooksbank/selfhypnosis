'use client';

/**
 * PhaseTimer — circular progress indicator with phase name and MM:SS countdown.
 *
 * - SVG circle fills from 100% → 0% as time elapses.
 * - Animated phase name transition when phase changes.
 * - Displays time in MM:SS format.
 */

import { useEffect, useRef, useState } from 'react';

import type { PhaseId } from '@/types/index';

export interface PhaseTimerProps {
    /** Current session phase. */
    phase: PhaseId;
    /** Seconds remaining in the current phase. */
    timeRemaining: number;
    /** Total seconds for the current phase (used to compute progress). */
    totalSeconds: number;
    /** Size of the circular timer in px. Defaults to 160. */
    size?: number;
}

const PHASE_LABELS: Record<PhaseId, string> = {
    preparation: 'Preparation',
    induction: 'Induction',
    deepening: 'Deepening',
    suggestion: 'Suggestion',
    emergence: 'Emergence',
};

const PHASE_COLORS: Record<PhaseId, string> = {
    preparation: '#818cf8', // indigo-400
    induction: '#6366f1', // indigo-500
    deepening: '#4f46e5', // indigo-600
    suggestion: '#a78bfa', // violet-400
    emergence: '#34d399', // emerald-400
};

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function PhaseTimer({ phase, timeRemaining, totalSeconds, size = 160 }: PhaseTimerProps) {
    const prevPhaseRef = useRef<PhaseId | null>(null);
    const [transitioning, setTransitioning] = useState(false);

    // Trigger fade animation when phase changes
    useEffect(() => {
        if (prevPhaseRef.current !== null && prevPhaseRef.current !== phase) {
            setTransitioning(true);
            const t = setTimeout(() => setTransitioning(false), 400);
            prevPhaseRef.current = phase;
            return () => clearTimeout(t);
        }
        prevPhaseRef.current = phase;
        return undefined;
    }, [phase]);

    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = totalSeconds > 0 ? timeRemaining / totalSeconds : 0;
    const dashOffset = circumference * (1 - progress);
    const color = PHASE_COLORS[phase];
    const center = size / 2;

    return (
        <div
            className={`relative inline-flex items-center justify-center transition-opacity duration-300 ${transitioning ? 'opacity-0' : 'opacity-100'}`}
            style={{ width: size, height: size }}
            aria-live="polite"
            aria-label={`${PHASE_LABELS[phase]}: ${formatTime(timeRemaining)} remaining`}
        >
            {/* Circular SVG track + arc */}
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="absolute inset-0 -rotate-90"
                aria-hidden="true"
            >
                {/* Background track */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress arc */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke-dashoffset 0.9s linear' }}
                />
            </svg>

            {/* Centred overlay: time + phase label */}
            <div className="relative flex flex-col items-center" aria-hidden="true">
                <span className="font-mono text-3xl font-semibold text-white tabular-nums">
                    {formatTime(timeRemaining)}
                </span>
                <span className="mt-1 text-xs font-medium tracking-widest text-white/70 uppercase">
                    {PHASE_LABELS[phase]}
                </span>
            </div>
        </div>
    );
}
