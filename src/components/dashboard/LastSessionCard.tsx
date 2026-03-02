'use client';

import Link from 'next/link';
import { useLiveQuery } from '@hooks/useDexieQuery';

import { db } from '@lib/db';

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    if (s === 0) return `${m}m`;
    return `${m}m ${s}s`;
}

function moodArrow(before?: number, after?: number): string | null {
    if (before == null || after == null) return null;
    const diff = after - before;
    if (diff > 0) return `+${diff}`;
    if (diff < 0) return `${diff}`;
    return '±0';
}

export function LastSessionCard() {
    const session = useLiveQuery(async () => {
        const completed = await db.sessions
            .where('completedAt')
            .notEqual('')
            .reverse()
            .sortBy('completedAt');
        return completed[0] ?? null;
    }, []);

    // useLiveQuery returns undefined while loading; null means loaded but empty
    if (session === undefined) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="h-16 animate-pulse rounded bg-gray-100" />
            </div>
        );
    }

    if (session === null) {
        return (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center shadow-sm">
                <p className="text-sm font-medium text-gray-500">No sessions yet</p>
                <p className="mt-1 text-xs text-gray-400">
                    Complete your first session to see it here.
                </p>
            </div>
        );
    }

    const moodChange = moodArrow(session.moodBefore, session.moodAfter);

    return (
        <Link
            href={`/session/${session.id}`}
            className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-800">
                        {session.templateId
                            ? session.templateId
                                  .split('-')
                                  .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                                  .join(' ')
                            : 'Custom Session'}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                        {formatDate(session.completedAt!)} · {formatTime(session.completedAt!)}
                    </p>
                </div>
                {session.depthRating != null && (
                    <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                        Depth {session.depthRating}/5
                    </span>
                )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                {session.actualDurationSeconds != null && (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {formatDuration(session.actualDurationSeconds)}
                    </span>
                )}
                {session.techniquesUsed.map(t => (
                    <span
                        key={t}
                        className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700"
                    >
                        {t
                            .split('-')
                            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(' ')}
                    </span>
                ))}
                {moodChange != null && (
                    <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                            moodChange.startsWith('+')
                                ? 'bg-green-50 text-green-700'
                                : moodChange.startsWith('-')
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                        Mood {moodChange}
                    </span>
                )}
            </div>
        </Link>
    );
}
