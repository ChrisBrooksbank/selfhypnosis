/**
 * Builds the SessionConfig for a guided session: the template's scripted phases, with
 * the user's own suggestions woven into the suggestion phase.
 */

import type { CustomSuggestion } from '@lib/db';
import type { GuidedSession, PhaseId } from '@/types';
import type { PhaseScript, SessionConfig } from './engine';

/** Seconds each personal suggestion is allotted during the suggestion phase. */
const PERSONAL_SUGGESTION_SECONDS = 30;

/**
 * Template segments keep `audioIndex` (their position in the recorded narration) so the
 * right clip plays even after personal suggestions shift positions. Personal
 * suggestions have no recording and are spoken by the device voice instead.
 */
export function buildConfig(
    sessionId: string,
    template: GuidedSession | undefined,
    personal: CustomSuggestion[]
): SessionConfig {
    if (!template) return { sessionId, type: 'guided' };

    const phases: Partial<Record<PhaseId, PhaseScript>> = {};
    for (const [phaseId, phase] of Object.entries(template.phases) as [
        PhaseId,
        GuidedSession['phases'][PhaseId],
    ][]) {
        phases[phaseId] = {
            durationMinutes: phase.durationMinutes,
            segments: phase.segments.map((seg, i) => ({ ...seg, audioIndex: i })),
        };
    }

    // Weave the user's own suggestions for this goal into the suggestion phase,
    // just before its closing segment, and lengthen the phase to fit them.
    const suggestionPhase = phases.suggestion;
    if (suggestionPhase && personal.length > 0) {
        const extra = personal.map(p => ({
            text: p.text,
            durationSeconds: PERSONAL_SUGGESTION_SECONDS,
        }));
        const segments = [...suggestionPhase.segments];
        segments.splice(Math.max(0, segments.length - 1), 0, ...extra);
        const totalSeconds = segments.reduce((sum, seg) => sum + seg.durationSeconds, 0);
        phases.suggestion = {
            segments,
            durationMinutes: Math.max(
                suggestionPhase.durationMinutes ?? 0,
                Math.ceil(totalSeconds / 60)
            ),
        };
    }

    return {
        sessionId,
        type: 'guided',
        templateId: template.id,
        goalArea: template.goalArea,
        techniquesUsed: template.techniquesUsed,
        plannedDurationMinutes: template.estimatedMinutes,
        suggestionIds: personal.map(p => p.id),
        phases,
    };
}
