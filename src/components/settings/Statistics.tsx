'use client';

import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@lib/db';
import type { TechniqueId } from '@/types';

const TECHNIQUE_NAMES: Record<TechniqueId, string> = {
    'eye-fixation': 'Eye Fixation',
    pmr: 'Progressive Muscle Relaxation',
    visualisation: 'Visualisation',
    countdown: 'Countdown',
    breathing: 'Breathing',
    '321-sensory': '3-2-1 Sensory',
    autogenic: 'Autogenic',
};

function formatDuration(totalMinutes: number): string {
    if (totalMinutes < 60) return `${Math.round(totalMinutes)}m`;
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.round(totalMinutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function Statistics() {
    const stats = useLiveQuery(async () => {
        const completed = await db.sessions.where('completedAt').notEqual('').toArray();

        if (completed.length === 0) {
            return null;
        }

        // Total sessions
        const totalSessions = completed.length;

        // Total time & average duration (in minutes)
        const totalSeconds = completed.reduce(
            (sum, s) => sum + (s.actualDurationSeconds ?? s.plannedDurationMinutes * 60),
            0
        );
        const totalMinutes = totalSeconds / 60;
        const avgMinutes = totalMinutes / totalSessions;

        // Average depth rating (only sessions with a rating)
        const withDepth = completed.filter(s => s.depthRating != null);
        const avgDepth =
            withDepth.length > 0
                ? withDepth.reduce((sum, s) => sum + (s.depthRating ?? 0), 0) / withDepth.length
                : null;

        // Most-used techniques
        const techniqueCounts: Partial<Record<TechniqueId, number>> = {};
        for (const session of completed) {
            for (const t of session.techniquesUsed) {
                techniqueCounts[t] = (techniqueCounts[t] ?? 0) + 1;
            }
        }
        const topTechniques = (Object.entries(techniqueCounts) as [TechniqueId, number][])
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);

        // Sessions per week (based on span from first to last session)
        const dates = completed.map(s => new Date(s.startedAt).getTime()).sort((a, b) => a - b);
        const spanMs = dates[dates.length - 1] - dates[0];
        const spanWeeks = Math.max(1, spanMs / (7 * 24 * 60 * 60 * 1000));
        const sessionsPerWeek = totalSessions / spanWeeks;

        return {
            totalSessions,
            totalMinutes,
            avgMinutes,
            avgDepth,
            topTechniques,
            sessionsPerWeek,
        };
    }, []);

    if (stats === undefined) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-gray-400">Loading statistics…</p>
            </div>
        );
    }

    if (stats === null) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-gray-500">
                    No completed sessions yet. Start practising to see your statistics.
                </p>
            </div>
        );
    }

    const { totalSessions, totalMinutes, avgMinutes, avgDepth, topTechniques, sessionsPerWeek } =
        stats;

    return (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold tracking-wide text-gray-700 uppercase">
                Practice Statistics
            </h3>

            {/* Grid of stat tiles */}
            <div className="grid grid-cols-2 gap-3">
                <StatTile label="Total Sessions" value={String(totalSessions)} />
                <StatTile label="Total Time" value={formatDuration(totalMinutes)} />
                <StatTile label="Avg Duration" value={formatDuration(avgMinutes)} />
                <StatTile label="Sessions / Week" value={sessionsPerWeek.toFixed(1)} />
                {avgDepth !== null && (
                    <StatTile label="Avg Depth" value={`${avgDepth.toFixed(1)} / 5`} />
                )}
            </div>

            {/* Top techniques */}
            {topTechniques.length > 0 && (
                <div>
                    <p className="mb-1.5 text-xs font-medium tracking-wide text-gray-500 uppercase">
                        Top Techniques
                    </p>
                    <ul className="space-y-1">
                        {topTechniques.map(([id, count]) => (
                            <li key={id} className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">{TECHNIQUE_NAMES[id]}</span>
                                <span className="text-xs text-gray-400">
                                    {count} {count === 1 ? 'session' : 'sessions'}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

interface StatTileProps {
    label: string;
    value: string;
}

function StatTile({ label, value }: StatTileProps) {
    return (
        <div className="flex flex-col items-center gap-0.5 rounded-lg bg-gray-50 p-3">
            <span className="text-2xl font-bold text-indigo-600">{value}</span>
            <span className="text-center text-xs font-medium text-gray-500">{label}</span>
        </div>
    );
}
