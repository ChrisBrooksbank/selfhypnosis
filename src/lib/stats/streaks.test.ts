import { describe, expect, it } from 'vitest';

import { calculateStreaks, getLocalDateKey } from './streaks';

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);
const key = (y: number, m: number, d: number) => getLocalDateKey(at(y, m, d));

describe('calculateStreaks', () => {
    const now = at(2026, 3, 10);

    it('returns zeros for no sessions', () => {
        expect(calculateStreaks([], now)).toEqual({ current: 0, best: 0 });
    });

    it('counts consecutive days ending today', () => {
        const days = [key(2026, 3, 8), key(2026, 3, 9), key(2026, 3, 10)];
        expect(calculateStreaks(days, now)).toEqual({ current: 3, best: 3 });
    });

    it('keeps the streak alive when the last session was yesterday', () => {
        const days = [key(2026, 3, 8), key(2026, 3, 9)];
        expect(calculateStreaks(days, now)).toEqual({ current: 2, best: 2 });
    });

    it('resets the current streak after a missed day', () => {
        const days = [key(2026, 3, 1), key(2026, 3, 2), key(2026, 3, 3), key(2026, 3, 8)];
        expect(calculateStreaks(days, now)).toEqual({ current: 0, best: 3 });
    });

    it('ignores duplicate sessions on the same day', () => {
        const days = [key(2026, 3, 10), key(2026, 3, 10), key(2026, 3, 9)];
        expect(calculateStreaks(days, now)).toEqual({ current: 2, best: 2 });
    });

    it('spans month boundaries', () => {
        const days = [key(2026, 2, 27), key(2026, 2, 28), key(2026, 3, 1)];
        expect(calculateStreaks(days, at(2026, 3, 1))).toEqual({ current: 3, best: 3 });
    });
});
