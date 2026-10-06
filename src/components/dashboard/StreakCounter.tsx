'use client';

import { useLiveQuery } from '@hooks/useDexieQuery';

import { db } from '@lib/db';
import { calculateStreaks, getLocalDateKey } from '@lib/stats/streaks';

export function StreakCounter() {
    const streaks = useLiveQuery(async () => {
        const completed = await db.sessions.where('completedAt').notEqual('').toArray();

        const dates = completed
            .filter(s => s.completedAt != null)
            .map(s => getLocalDateKey(s.completedAt!));

        return calculateStreaks(dates);
    }, []);

    const current = streaks?.current ?? 0;
    const best = streaks?.best ?? 0;

    return (
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-1 flex-col items-center gap-0.5">
                <span className="text-3xl font-bold text-indigo-600">{current}</span>
                <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                    Day Streak
                </span>
            </div>
            <div className="h-10 w-px bg-gray-200" />
            <div className="flex flex-1 flex-col items-center gap-0.5">
                <span className="text-3xl font-bold text-gray-700">{best}</span>
                <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                    Best Streak
                </span>
            </div>
        </div>
    );
}
