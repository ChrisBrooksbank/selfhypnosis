import type { GuidedSession } from '@/types';

import beginnerRelaxation from './beginner-relaxation.json';
import stressRelief from './stress-relief.json';
import sleepPreparation from './sleep-preparation.json';
import painManagement from './pain-management.json';
import confidenceBuilding from './confidence-building.json';
import ibsGutCalm from './ibs-gut-calm.json';
import mindfulEating from './mindful-eating.json';
import smokeFree from './smoke-free.json';
import handsAtPeace from './hands-at-peace.json';
import embersForTwo from './embers-for-two.json';

/** All guided session templates, in display order. */
export const GUIDED_SESSIONS: GuidedSession[] = [
    beginnerRelaxation,
    stressRelief,
    sleepPreparation,
    painManagement,
    confidenceBuilding,
    ibsGutCalm,
    mindfulEating,
    smokeFree,
    handsAtPeace,
    embersForTwo,
] as GuidedSession[];

export function getGuidedSession(id: string | undefined): GuidedSession | undefined {
    if (!id) return undefined;
    return GUIDED_SESSIONS.find(s => s.id === id);
}
