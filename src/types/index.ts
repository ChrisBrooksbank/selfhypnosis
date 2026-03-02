/**
 * Centralized Type Definitions
 */

export type { AppConfig } from '@config/schema';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export type TechniqueId =
    | 'eye-fixation'
    | 'pmr'
    | 'visualisation'
    | 'countdown'
    | 'breathing'
    | '321-sensory'
    | 'autogenic';

export type GoalArea =
    | 'stress-anxiety'
    | 'pain'
    | 'sleep'
    | 'habits'
    | 'performance'
    | 'ibs'
    | 'childbirth'
    | 'general-relaxation';

export type PhaseId = 'preparation' | 'induction' | 'deepening' | 'suggestion' | 'emergence';

export interface TechniqueStep {
    number: number;
    instruction: string;
    duration?: string;
}

export interface Technique {
    id: TechniqueId;
    name: string;
    tagline: string;
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    goalAreas: GoalArea[];
    overview: string;
    steps: TechniqueStep[];
    scienceBlurb: string;
    citations: string[];
    relatedTechniques: TechniqueId[];
}
