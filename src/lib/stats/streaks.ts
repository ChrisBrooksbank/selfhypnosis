/**
 * Practice streak calculation, based on the user's local calendar days.
 *
 * Day keys are `YYYY-MM-DD` strings in local time. All day arithmetic is done
 * with local-time Date constructors — parsing a key with `new Date('YYYY-MM-DD')`
 * yields UTC midnight, which is the previous local day west of Greenwich.
 */

export function getLocalDateKey(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Day key for the calendar day `offset` days away from `key` (negative = earlier). */
function shiftDayKey(key: string, offset: number): string {
    const [y, m, d] = key.split('-').map(Number);
    return getLocalDateKey(new Date(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + offset));
}

export function calculateStreaks(
    dayKeys: string[],
    now: Date = new Date()
): { current: number; best: number } {
    if (dayKeys.length === 0) return { current: 0, best: 0 };

    const days = new Set(dayKeys);
    const ascending = [...days].sort();

    // Current streak: count backwards from today, or from yesterday if today has no session yet.
    const today = getLocalDateKey(now);
    let cursor = days.has(today) ? today : shiftDayKey(today, -1);
    let current = 0;
    while (days.has(cursor)) {
        current++;
        cursor = shiftDayKey(cursor, -1);
    }

    // Best streak: longest run of consecutive days.
    let best = 0;
    let run = 0;
    let prev: string | null = null;
    for (const day of ascending) {
        run = prev !== null && shiftDayKey(prev, 1) === day ? run + 1 : 1;
        if (run > best) best = run;
        prev = day;
    }

    return { current, best };
}
