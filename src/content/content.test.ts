import { describe, expect, it } from 'vitest';

import type { GoalArea, PhaseId, TechniqueId } from '@/types';
import { GUIDED_SESSIONS } from '@/content/sessions';

import eyeFixation from '@/content/techniques/eye-fixation.json';
import pmr from '@/content/techniques/pmr.json';
import visualisation from '@/content/techniques/visualisation.json';
import countdown from '@/content/techniques/countdown.json';
import breathing from '@/content/techniques/breathing.json';
import sensory321 from '@/content/techniques/321-sensory.json';
import autogenic from '@/content/techniques/autogenic.json';

const GOAL_AREAS: GoalArea[] = [
    'stress-anxiety',
    'pain',
    'sleep',
    'habits',
    'performance',
    'ibs',
    'childbirth',
    'general-relaxation',
];
const TECHNIQUE_IDS: TechniqueId[] = [
    'eye-fixation',
    'pmr',
    'visualisation',
    'countdown',
    'breathing',
    '321-sensory',
    'autogenic',
];
const PHASES: PhaseId[] = ['preparation', 'induction', 'deepening', 'suggestion', 'emergence'];

const techniques = [eyeFixation, pmr, visualisation, countdown, breathing, sensory321, autogenic];

describe('technique content', () => {
    it.each(techniques.map(t => [t.id, t] as const))('%s uses valid ids', (_id, t) => {
        expect(TECHNIQUE_IDS).toContain(t.id);
        for (const area of t.goalAreas) expect(GOAL_AREAS).toContain(area);
        for (const related of t.relatedTechniques) expect(TECHNIQUE_IDS).toContain(related);
    });
});

describe('guided session content', () => {
    it.each(GUIDED_SESSIONS.map(s => [s.id, s] as const))('%s is well-formed', (_id, s) => {
        expect(GOAL_AREAS).toContain(s.goalArea);
        for (const t of s.techniquesUsed) expect(TECHNIQUE_IDS).toContain(t);
        for (const phase of PHASES) {
            expect(s.phases[phase]?.segments.length).toBeGreaterThan(0);
        }
    });
});
