import { describe, expect, it } from 'vitest';

import type { CustomSuggestion } from '@lib/db';
import { getGuidedSession } from '@/content/sessions';
import { buildConfig } from './sessionConfig';

function suggestion(id: string, text: string): CustomSuggestion {
    return { id, text } as CustomSuggestion;
}

const template = getGuidedSession('stress-relief');

describe('buildConfig', () => {
    it('has a stress-relief template to test against', () => {
        expect(template).toBeDefined();
    });

    it('tags every template segment with its recorded clip index', () => {
        const config = buildConfig('s1', template, []);
        for (const phase of Object.values(config.phases ?? {})) {
            phase.segments.forEach((seg, i) => expect(seg.audioIndex).toBe(i));
        }
    });

    it('keeps the right clip for template lines after personal suggestions are woven in', () => {
        const original = template!.phases.suggestion.segments;
        const config = buildConfig('s1', template, [
            suggestion('a', 'I am calm.'),
            suggestion('b', 'I am capable.'),
        ]);
        const segments = config.phases!.suggestion!.segments;

        expect(segments).toHaveLength(original.length + 2);

        // Personal suggestions sit before the closing line and have no recording.
        const personal = segments.filter(s => s.audioIndex === undefined);
        expect(personal.map(s => s.text)).toEqual(['I am calm.', 'I am capable.']);

        // Every template line still points at its own clip and its own text.
        const templateLines = segments.filter(s => s.audioIndex !== undefined);
        expect(templateLines).toHaveLength(original.length);
        templateLines.forEach(seg => {
            expect(seg.text).toBe(original[seg.audioIndex!]!.text);
        });

        // The closing line is still last.
        const last = segments[segments.length - 1]!;
        expect(last.audioIndex).toBe(original.length - 1);
    });

    it('lengthens the suggestion phase to fit personal suggestions', () => {
        const base = buildConfig('s1', template, []).phases!.suggestion!;
        const withPersonal = buildConfig(
            's1',
            template,
            Array.from({ length: 3 }, (_, i) => suggestion(`p${i}`, `Suggestion ${i}`))
        ).phases!.suggestion!;
        expect(withPersonal.durationMinutes!).toBeGreaterThanOrEqual(base.durationMinutes ?? 0);
    });

    it('returns a bare guided config when there is no template', () => {
        expect(buildConfig('s1', undefined, [])).toEqual({ sessionId: 's1', type: 'guided' });
    });
});
