import { describe, expect, it } from 'vitest';

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import prose from '@/content/prose.json';
import { stepGapMs } from './pacing';

describe('stepGapMs', () => {
    it('reads seconds and minutes', () => {
        expect(stepGapMs('30 seconds')).toBe(30_000);
        expect(stepGapMs('1 minute')).toBe(60_000);
        expect(stepGapMs('2 minutes')).toBe(120_000);
    });

    it('uses the lower end of a range', () => {
        expect(stepGapMs('1–2 minutes')).toBe(60_000);
        expect(stepGapMs('30-60 seconds')).toBe(30_000);
    });

    it('clamps very short and very long durations', () => {
        expect(stepGapMs('3 seconds')).toBe(8_000);
        expect(stepGapMs('10 minutes')).toBe(120_000);
    });

    it('uses a default when there is no usable duration', () => {
        expect(stepGapMs(undefined)).toBe(15_000);
        expect(stepGapMs('as long as you like')).toBe(15_000);
    });

    it('produces a sensible gap for every real technique step', () => {
        const dir = join(process.cwd(), 'src', 'content', 'techniques');
        for (const file of readdirSync(dir).filter(f => f.endsWith('.json'))) {
            const technique = JSON.parse(readFileSync(join(dir, file), 'utf8')) as {
                steps: { duration?: string }[];
            };
            for (const step of technique.steps) {
                const gap = stepGapMs(step.duration);
                expect(gap).toBeGreaterThanOrEqual(8_000);
                expect(gap).toBeLessThanOrEqual(120_000);
            }
        }
    });
});

describe('onboarding prose', () => {
    it('keeps the screening question ids the onboarding code depends on', () => {
        expect(prose.screening.questions.map(q => q.id)).toEqual([
            'psychosis',
            'dissociation',
            'epilepsy',
            'ptsd',
            'trauma',
            'personality',
        ]);
    });
});
