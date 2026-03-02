import Dexie, { type EntityTable } from 'dexie';

import type { GoalArea, PhaseId, TechniqueId } from '@/types';

// ─── Entity Types ────────────────────────────────────────────────────────────

export interface UserSettings {
    id: 'user';
    onboardingComplete: boolean;
    safetyAcknowledgedAt?: string; // ISO date
    contraindicationAnswers: boolean[]; // 6 answers
    hasContraindication: boolean;
    riskLevel: 'none' | 'amber' | 'red';
    notificationsEnabled: boolean;
    notificationTime?: string; // HH:MM format
    defaultSessionDuration: number; // minutes
    preferredTechniques: TechniqueId[];
    theme: 'light' | 'dark' | 'system';
}

export interface SessionRecord {
    id: string; // UUID
    startedAt: string; // ISO date
    completedAt?: string; // ISO date — null until session ends
    interruptedAt?: string; // ISO date — set if session was abandoned
    type: 'guided' | 'timer' | 'custom';
    templateId?: string; // session JSON id for guided sessions
    goalArea?: GoalArea;
    techniquesUsed: TechniqueId[];
    plannedDurationMinutes: number;
    actualDurationSeconds?: number;
    phasesCompleted: PhaseId[];
    suggestionIds: string[];
    notes?: string;
    depthRating?: number; // 1-5
    moodBefore?: number; // 1-5
    moodAfter?: number; // 1-5
}

export interface CustomSuggestion {
    id: string; // UUID
    goalArea: GoalArea;
    text: string;
    tags: string[];
    validationScore: number; // 0-5
    guidelineFlags: {
        isPositive: boolean;
        isPresentTense: boolean;
        isSpecific: boolean;
        isBelievable: boolean;
        isEmotional: boolean;
    };
    isFavourite: boolean;
    usageCount: number;
    lastUsedAt?: string; // ISO date
    createdAt: string; // ISO date
}

export interface JournalEntry {
    id: string; // UUID
    sessionId?: string; // nullable link to SessionRecord
    body: string;
    moodBefore?: number; // 1-5
    moodAfter?: number; // 1-5
    depthRating?: number; // 1-5
    tags: string[];
    techniqueNotes?: string;
    createdAt: string; // ISO date
    updatedAt: string; // ISO date
}

// ─── Database Class ───────────────────────────────────────────────────────────

class SelfHypnosisDB extends Dexie {
    settings!: EntityTable<UserSettings, 'id'>;
    sessions!: EntityTable<SessionRecord, 'id'>;
    suggestions!: EntityTable<CustomSuggestion, 'id'>;
    journal!: EntityTable<JournalEntry, 'id'>;

    constructor() {
        super('SelfHypnosisDB');

        this.version(1).stores({
            settings: 'id',
            sessions: 'id, startedAt, completedAt, type, goalArea',
            suggestions: 'id, goalArea, createdAt, isFavourite, usageCount',
            journal: 'id, sessionId, createdAt',
        });
    }
}

export const db = new SelfHypnosisDB();
