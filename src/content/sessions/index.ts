import type { GuidedSession } from '@/types';

import beginnerRelaxation from './beginner-relaxation.json';
import stressRelief from './stress-relief.json';
import sleepPreparation from './sleep-preparation.json';
import painManagement from './pain-management.json';
import confidenceBuilding from './confidence-building.json';

/** All guided session templates, in display order. */
export const GUIDED_SESSIONS: GuidedSession[] = [
    beginnerRelaxation,
    stressRelief,
    sleepPreparation,
    painManagement,
    confidenceBuilding,
] as GuidedSession[];

export function getGuidedSession(id: string | undefined): GuidedSession | undefined {
    if (!id) return undefined;
    return GUIDED_SESSIONS.find(s => s.id === id);
}
