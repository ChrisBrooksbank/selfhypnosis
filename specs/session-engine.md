# Session Engine

## Overview

The core state machine that drives self-hypnosis sessions through 5 phases: preparation → induction → deepening → suggestion → emergence. Includes phase timer, script display, phase transitions, and IndexedDB persistence.

## References

- `plan.md` → Session Engine Design section, Data Model (SessionRecord)
- `research.md` → Step-by-Step Self-Hypnosis Protocol (all 5 phases)

## User Stories

- As a user, I progress through 5 clearly labeled session phases so I know where I am in the process.
- As a user, I see timed text scripts that guide me through each phase.
- As a user, I can see a countdown timer for each phase so I know how long remains.
- As a user, I can skip a phase (except emergence) if I want to move faster.
- As a user, my session is saved even if I close the app mid-session.

## Requirements

### Session State Machine

- `src/lib/session/engine.ts`
- States: `idle` → `preparation` → `induction` → `deepening` → `suggestion` → `emergence` → `complete`.
- Driven by a 1-second interval tick (use `IntervalManager` from `@utils/helpers`).
- Each phase has: `defaultMinutes`, `minMinutes`, `maxMinutes`, `scriptSegments[]`, `allowSkip`.
- Emergence is NEVER skippable (safety requirement) with minimum 2 minutes.
- Phase transitions: auto-advance when timer expires, or user-triggered skip.
- Engine exposes: `currentPhase`, `timeRemaining`, `currentSegment`, `totalElapsed`, `start()`, `skip()`, `pause()`, `resume()`, `stop()`.

### Phase Configuration

- `src/lib/session/phaseConfig.ts`
- Default durations (from research.md protocol):
    - Preparation: 2-5 min (default 3)
    - Induction: 3-7 min (default 5)
    - Deepening: 3-5 min (default 4)
    - Suggestion: 5-15 min (default 10)
    - Emergence: 2-3 min (default 3, min 2, NOT skippable)

### Script Display

- `src/components/session/ScriptDisplay.tsx`
- Displays current script segment text.
- Typewriter reveal effect (text appears character by character).
- After 8 seconds, text fades to low opacity (so user can close eyes).
- Segments auto-advance based on configured timing.

### Phase Timer

- `src/components/session/PhaseTimer.tsx`
- Circular or linear progress indicator showing time remaining in current phase.
- Displays phase name and time in MM:SS format.
- Visual transition between phases.

### Phase Display

- `src/components/session/PhaseDisplay.tsx`
- Shows all 5 phases as a progress bar/stepper.
- Current phase highlighted, completed phases marked.
- Compact enough for session screen.

### Session Persistence

- On session start: create `SessionRecord` in IndexedDB with `completedAt: null`.
- On each phase completion: update record with phase progress.
- On session end: set `completedAt`, `actualDurationSeconds`, `phasesCompleted`.
- On app reopen: detect interrupted sessions (non-null start, null completedAt) and offer to resume or discard.

### React Hook

- `src/hooks/useSessionEngine.ts`
- Wraps the state machine for React components.
- Returns: `{ phase, timeRemaining, segment, totalElapsed, isRunning, isPaused, start, skip, pause, resume, stop }`.

### Active Session Page

- `app/session/[sessionId]/page.tsx`
- Full-screen layout (hide bottom nav).
- Shows: PhaseDisplay, PhaseTimer, ScriptDisplay.
- Skip button (hidden during emergence).
- Pause/resume button.
- Emergency exit button (skips to emergence).

## Acceptance Criteria

- [ ] State machine transitions through all 5 phases in correct order.
- [ ] Timer counts down correctly for each phase.
- [ ] Script segments display with typewriter effect and fade.
- [ ] Emergence phase cannot be skipped and has minimum 2-minute duration.
- [ ] Skip works for all non-emergence phases.
- [ ] Pause/resume works correctly (timer stops/resumes).
- [ ] Session record is written to IndexedDB on start and updated on completion.
- [ ] Interrupted sessions are detected on app reopen.
- [ ] `npm run check` passes.

## Out of Scope

- Audio synchronization (see specs/audio-playback.md).
- Session launcher / technique selection (see specs/guided-sessions.md).
- Post-session summary (see specs/journal.md for mood/depth tracking).
