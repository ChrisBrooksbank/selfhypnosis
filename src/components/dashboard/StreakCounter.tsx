'use client';

import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@lib/db';

function getLocalDateKey(isoDate: string): string {
    const d = new Date(isoDate);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function calculateStreaks(completedDates: string[]): { current: number; best: number } {
    if (completedDates.length === 0) return { current: 0, best: 0 };

    // Unique days with completed sessions, sorted descending
    const uniqueDays = [...new Set(completedDates)].sort().reverse();

    const today = getLocalDateKey(new Date().toISOString());
    const yesterday = getLocalDateKey(new Date(Date.now() - 86400000).toISOString());

    // Current streak: count backwards from today or yesterday
    let current = 0;
    if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
        let cursor = new Date(uniqueDays[0]);
        for (const day of uniqueDays) {
            const cursorKey = getLocalDateKey(cursor.toISOString());
            if (day === cursorKey) {
                current++;
                cursor = new Date(cursor.getTime() - 86400000);
            } else {
                break;
            }
        }
    }

    // Best streak: scan all days sorted ascending
    const ascending = [...uniqueDays].reverse();
    let best = 0;
    let run = 0;
    let prev: string | null = null;
    for (const day of ascending) {
        if (prev === null) {
            run = 1;
        } else {
            const prevDate = new Date(prev);
            const expected = getLocalDateKey(new Date(prevDate.getTime() + 86400000).toISOString());
            if (day === expected) {
                run++;
            } else {
                run = 1;
            }
        }
        if (run > best) best = run;
        prev = day;
    }

    return { current, best };
}

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
