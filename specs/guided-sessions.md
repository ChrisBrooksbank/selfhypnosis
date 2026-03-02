# Guided Sessions

## Overview

Pre-built session scripts that combine techniques, timed phases, and therapeutic suggestions into complete guided experiences. 3 sessions for MVP (Phase 1), 2 more in Phase 3. Content stored as JSON with script segments per phase.

## References

- `plan.md` → Phase 1 (3 guided sessions), Phase 3 (2 more sessions), Session Engine Design
- `research.md` → Step-by-Step Protocol, Applications and Evidence, Core Techniques

## User Stories

- As a beginner, I can start a pre-built guided session so I don't need to know what to do.
- As a user, I can choose from sessions targeting different goals (relaxation, stress, sleep, pain, confidence).
- As a user, each session guides me through all 5 phases with appropriate scripts.

## Requirements

### Session JSON Format

- `src/content/sessions/{sessionId}.json`
- Schema:
    ```typescript
    {
      id: string;
      name: string;
      description: string;
      goalArea: GoalArea;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      estimatedMinutes: number;
      techniquesUsed: TechniqueId[];
      phases: {
        [phaseId in PhaseId]: {
          durationMinutes: number;
          segments: {
            text: string;
            durationSeconds: number;
            audioTrackId?: string;
          }[];
        };
      };
    }
    ```

### MVP Sessions (Phase 1)

**1. Beginner Relaxation** (`beginner-relaxation`)

- Goal: general-relaxation
- Techniques: breathing, pmr, visualisation
- ~20 minutes
- Preparation: breathing focus, setting intention for relaxation
- Induction: controlled breathing (4-4-6 pattern), progressive muscle relaxation (abbreviated)
- Deepening: countdown 10→1 with staircase visualisation
- Suggestion: general relaxation and calm suggestions, safe-place imagery
- Emergence: count 1→5 with reorientation

**2. Stress Relief** (`stress-relief`)

- Goal: stress-anxiety
- Techniques: breathing, 321-sensory, visualisation
- ~25 minutes
- Preparation: acknowledge current stress, set intention to release
- Induction: 3-2-1 sensory awareness technique (Betty Erickson method)
- Deepening: controlled breathing with wave metaphor
- Suggestion: stress-specific suggestions ("I release tension with each breath", "My mind is calm and clear"), river metaphor carrying stress away
- Emergence: count 1→5, feeling refreshed and lighter

**3. Sleep Preparation** (`sleep-preparation`)

- Goal: sleep
- Techniques: autogenic, pmr, countdown
- ~20 minutes
- Preparation: bedtime routine cues, dimming awareness
- Induction: autogenic training (heaviness and warmth formulas)
- Deepening: progressive relaxation, body scan
- Suggestion: sleep-specific suggestions ("I drift into deep, restful sleep", "My mind quiets naturally"), cloud imagery
- Emergence: gentle (designed to transition into sleep rather than full alertness), shortened to 2 minutes

### Phase 3 Sessions

**4. Pain Management** (`pain-management`)

- Goal: pain
- Techniques: visualisation, breathing, autogenic
- ~25 minutes
- Includes contextual warning about medical diagnosis (per safety spec).
- Suggestion: glove anaesthesia technique, healing light imagery, pain dial metaphor.

**5. Confidence Building** (`confidence-building`)

- Goal: performance
- Techniques: eye-fixation, visualisation, countdown
- ~20 minutes
- Suggestion: mental rehearsal of confident performance, anchoring technique.

### Session Launcher

- `src/components/session/SessionLauncher.tsx`
- Card-based session selection showing: name, goal, difficulty, duration, techniques used.
- Launch button that creates a new SessionRecord and navigates to `/session/[sessionId]`.
- Disabled for users with 3+ contraindications (red safety level).

### Session Summary

- `src/components/session/SessionSummary.tsx`
- Shown after emergence phase completes.
- Depth rating (1-5 scale).
- Mood before/after (1-5 scale).
- Optional notes textarea.
- Save to IndexedDB and return to home.

## Acceptance Criteria

- [ ] 3 MVP session JSON files exist with complete script content for all 5 phases.
- [ ] Session launcher displays available sessions with metadata.
- [ ] Launching a session creates a SessionRecord and starts the engine.
- [ ] Script segments are correctly loaded and displayed by the session engine.
- [ ] Session summary captures depth, mood, and notes.
- [ ] Summary data is saved to the SessionRecord in IndexedDB.
- [ ] Session launcher is disabled for high-risk users.
- [ ] `npm run check` passes.

## Out of Scope

- Audio tracks (see specs/audio-playback.md).
- Custom session building (Phase 4).
- Timer-only mode (see specs/settings-notifications.md).
