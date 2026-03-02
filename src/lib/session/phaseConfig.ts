import type { PhaseId } from '@/types/index';

export interface PhaseConfig {
    defaultMinutes: number;
    minMinutes: number;
    maxMinutes: number;
    allowSkip: boolean;
}

export const PHASE_CONFIG: Record<PhaseId, PhaseConfig> = {
    preparation: {
        defaultMinutes: 3,
        minMinutes: 2,
        maxMinutes: 5,
        allowSkip: true,
    },
    induction: {
        defaultMinutes: 5,
        minMinutes: 3,
        maxMinutes: 7,
        allowSkip: true,
    },
    deepening: {
        defaultMinutes: 4,
        minMinutes: 3,
        maxMinutes: 5,
        allowSkip: true,
    },
    suggestion: {
        defaultMinutes: 10,
        minMinutes: 5,
        maxMinutes: 15,
        allowSkip: true,
    },
    emergence: {
        defaultMinutes: 3,
        minMinutes: 2,
        maxMinutes: 3,
        allowSkip: false,
    },
};

export const PHASE_ORDER: PhaseId[] = [
    'preparation',
    'induction',
    'deepening',
    'suggestion',
    'emergence',
];
