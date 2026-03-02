# Implementation Plan

> Auto-managed by Ralph Wiggum loop. Tasks are checked off as completed.
> Run `./loop.sh plan` to update this file from specs.

---

## Phase 1 — PWA Shell & Foundation (See specs/pwa-shell.md)

### Already Complete

- [x] TypeScript project scaffold with Next.js App Router, Tailwind CSS v4, Vitest
- [x] Domain types `TechniqueId`, `GoalArea`, `PhaseId` defined in `src/types/index.ts`
- [x] Logger utility with levels and debug mode (`src/utils/logger.ts`)
- [x] Helper utilities: `retryWithBackoff`, `debounce`, `throttle`, `IntervalManager` (`src/utils/helpers.ts`)
- [x] Config system: Zod schema + async loader + `getConfig()` (`src/config/`)

### Dexie Database

- [x] Create `src/lib/db.ts` — Dexie v4 database with tables: `settings`, `sessions`, `suggestions`, `journal`; add TypeScript entity types (`UserSettings`, `SessionRecord`, `CustomSuggestion`, `JournalEntry`) and schema v1. See specs/pwa-shell.md, specs/settings-notifications.md.

### PWA Manifest & Service Worker

- [x] Replace `public/manifest.json` with `app/manifest.ts` — Next.js `MetadataRoute.Manifest` returning name, short_name, icons (192, 384, 512), theme_color `#6366f1`, background_color, display `standalone`. See specs/pwa-shell.md.
- [x] Add `@serwist/next` dependency and configure in `next.config.mjs`. See specs/pwa-shell.md.
- [ ] Create `app/sw.ts` — Serwist service worker with `defaultCache` for static assets. See specs/pwa-shell.md.
- [ ] Add PWA icon placeholders to `public/icons/` (192x192, 384x384, 512x512 PNG). See specs/pwa-shell.md.

### Layout Components

- [ ] Create `src/components/layout/PageHeader.tsx` — reusable header with `title` prop and optional back button. See specs/pwa-shell.md.
- [ ] Create `src/components/layout/BottomNav.tsx` — fixed bottom bar with 5 tabs (Home, Library, Session, Journal, Settings), active route highlighting, hidden when `data-fullscreen` is set. See specs/pwa-shell.md.
- [ ] Create `src/components/layout/SafetyGate.tsx` — reads `onboardingComplete` from IndexedDB; redirects to `/onboarding` if false; shows amber/red warning banner based on `riskLevel`; renders children otherwise. See specs/safety-onboarding.md.
- [ ] Update `app/layout.tsx` — wrap children with `<SafetyGate>` and `<BottomNav>`; add safe-area padding (`env(safe-area-inset-*)`); constrain max content width to 640px centered. See specs/pwa-shell.md.

### Route Scaffolding

- [ ] Create `app/onboarding/page.tsx` — placeholder layout (3-screen onboarding will be implemented under Safety). See specs/pwa-shell.md.
- [ ] Create `app/library/page.tsx` — placeholder layout. See specs/pwa-shell.md.
- [ ] Create `app/library/[techniqueId]/page.tsx` — placeholder with `generateStaticParams` returning all 7 `TechniqueId` values. See specs/pwa-shell.md.
- [ ] Create `app/session/page.tsx` — placeholder layout (session launcher). See specs/pwa-shell.md.
- [ ] Create `app/session/[sessionId]/page.tsx` — placeholder full-screen layout. See specs/pwa-shell.md.
- [ ] Create `app/suggestions/page.tsx` — placeholder layout. See specs/pwa-shell.md.
- [ ] Create `app/suggestions/builder/page.tsx` — placeholder layout. See specs/pwa-shell.md.
- [ ] Create `app/journal/page.tsx` — placeholder layout. See specs/pwa-shell.md.
- [ ] Create `app/journal/[entryId]/page.tsx` — placeholder layout. See specs/pwa-shell.md.
- [ ] Create `app/settings/page.tsx` — placeholder layout. See specs/pwa-shell.md.

---

## Phase 1 — Safety & Onboarding (See specs/safety-onboarding.md)

- [ ] Create `src/hooks/useOnboardingStatus.ts` — reads `settings` table; returns `{ isComplete, hasContraindication, riskLevel }` using `useLiveQuery`. See specs/safety-onboarding.md.
- [ ] Create `src/components/onboarding/WelcomeSlide.tsx` — intro screen with myth-busting bullets and "Get Started" button. See specs/safety-onboarding.md.
- [ ] Create `src/components/onboarding/ContraindicationForm.tsx` — 6 yes/no questions with explanations; submit enabled only when all answered. See specs/safety-onboarding.md.
- [ ] Create `src/components/onboarding/SafetyAcknowledgement.tsx` — single checkbox acknowledgement; "Complete Setup" enabled only when checked. See specs/safety-onboarding.md.
- [ ] Implement `app/onboarding/page.tsx` — 3-screen stepper using the three onboarding components; on completion writes `UserSettings` record to IndexedDB (`onboardingComplete: true`, `contraindicationAnswers`, `riskLevel`, `safetyAcknowledgedAt`). See specs/safety-onboarding.md.
- [ ] Update `SafetyGate.tsx` — implement amber banner (1-2 yes answers) and red banner with session-launch disable (3+ yes answers) based on persisted `riskLevel`. See specs/safety-onboarding.md.

---

## Phase 1 — Technique Library (See specs/technique-library.md)

### Content

- [ ] Add `Technique` type to `src/types/index.ts` matching the JSON schema (id, name, tagline, difficultyLevel, goalAreas, overview, steps, scienceBlurb, citations, relatedTechniques). See specs/technique-library.md.
- [ ] Create `src/content/techniques/eye-fixation.json` — content from research.md. See specs/technique-library.md.
- [ ] Create `src/content/techniques/pmr.json` — progressive muscle relaxation content. See specs/technique-library.md.
- [ ] Create `src/content/techniques/visualisation.json`. See specs/technique-library.md.
- [ ] Create `src/content/techniques/countdown.json`. See specs/technique-library.md.
- [ ] Create `src/content/techniques/breathing.json`. See specs/technique-library.md.
- [ ] Create `src/content/techniques/321-sensory.json` — Betty Erickson method. See specs/technique-library.md.
- [ ] Create `src/content/techniques/autogenic.json`. See specs/technique-library.md.

### UI Components

- [ ] Create `src/components/library/TechniqueCard.tsx` — card with name, tagline, difficulty badge, goal-area tags. See specs/technique-library.md.
- [ ] Create `src/components/library/SciencePanel.tsx` — science blurb + citations list. See specs/technique-library.md.
- [ ] Create `src/components/library/TechniqueDetail.tsx` — 3-tab layout: How it Works, The Science, Try It (step-by-step with Next button). See specs/technique-library.md.

### Pages

- [ ] Implement `app/library/page.tsx` — loads all 7 technique JSON files; search input filtering by name/tagline; goal-area filter chips (multi-select intersection); responsive 2-column card grid. See specs/technique-library.md.
- [ ] Implement `app/library/[techniqueId]/page.tsx` — full `generateStaticParams` for all 7 IDs; renders `TechniqueDetail`. See specs/technique-library.md.

---

## Phase 1 — Session Engine (See specs/session-engine.md)

- [ ] Create `src/lib/session/phaseConfig.ts` — per-phase defaults: `defaultMinutes`, `minMinutes`, `maxMinutes`, `allowSkip`; emergence: min 2 min, `allowSkip: false`. See specs/session-engine.md.
- [ ] Create `src/lib/session/engine.ts` — class-based state machine with states `idle → preparation → induction → deepening → suggestion → emergence → complete`; 1-second tick via `IntervalManager`; methods `start()`, `skip()`, `pause()`, `resume()`, `stop()`; emits phase/segment/tick events. See specs/session-engine.md.
- [ ] Create `src/hooks/useSessionEngine.ts` — React wrapper returning `{ phase, timeRemaining, segment, totalElapsed, isRunning, isPaused, start, skip, pause, resume, stop }`. See specs/session-engine.md.
- [ ] Add session persistence to engine: create `SessionRecord` in IndexedDB on `start()`; update on phase completion; set `completedAt` on `complete`. See specs/session-engine.md.
- [ ] Add interrupted session detection: on app mount check IndexedDB for records with non-null `startedAt` and null `completedAt`; expose via `useSessionEngine`. See specs/session-engine.md.
- [ ] Create `src/components/session/ScriptDisplay.tsx` — typewriter reveal (character-by-character); fades to low opacity after 8 seconds; auto-advances segments. See specs/session-engine.md.
- [ ] Create `src/components/session/PhaseTimer.tsx` — circular/linear progress indicator; phase name + MM:SS countdown; animated phase transition. See specs/session-engine.md.
- [ ] Create `src/components/session/PhaseDisplay.tsx` — 5-phase stepper bar; current phase highlighted; completed phases marked. See specs/session-engine.md.
- [ ] Implement `app/session/[sessionId]/page.tsx` — full-screen layout (hides bottom nav); renders `PhaseDisplay`, `PhaseTimer`, `ScriptDisplay`; skip button (hidden during emergence); pause/resume button; emergency exit button (jumps to emergence). See specs/session-engine.md.

---

## Phase 1 — Guided Sessions (See specs/guided-sessions.md)

### Session Content (3 MVP)

- [ ] Add `GuidedSession` type to `src/types/index.ts` matching the session JSON schema (id, name, description, goalArea, difficulty, estimatedMinutes, techniquesUsed, phases). See specs/guided-sessions.md.
- [ ] Create `src/content/sessions/beginner-relaxation.json` — full 5-phase script for beginner relaxation (~20 min); techniques: breathing, pmr, visualisation. See specs/guided-sessions.md.
- [ ] Create `src/content/sessions/stress-relief.json` — full 5-phase script for stress relief (~25 min); techniques: breathing, 321-sensory, visualisation. See specs/guided-sessions.md.
- [ ] Create `src/content/sessions/sleep-preparation.json` — full 5-phase script for sleep (~20 min); techniques: autogenic, pmr, countdown; shortened emergence (2 min). See specs/guided-sessions.md.

### UI Components

- [ ] Create `src/components/session/SessionLauncher.tsx` — card grid of available sessions; shows name, goal, difficulty, duration, techniques; launch button creates `SessionRecord` and navigates to `/session/[sessionId]`; disabled for `riskLevel === 'red'`. See specs/guided-sessions.md.
- [ ] Create `src/components/session/SessionSummary.tsx` — post-session screen with depth rating (1-5), mood before/after (1-5), optional notes; saves to `SessionRecord` in IndexedDB; prompt to continue to journal. See specs/guided-sessions.md.

### Pages

- [ ] Implement `app/session/page.tsx` — renders `SessionLauncher` with all available sessions. See specs/guided-sessions.md.

---

## Phase 2 — Dashboard & Home (See specs/dashboard-home.md)

- [ ] Create `src/components/dashboard/StreakCounter.tsx` — queries `sessions` table; calculates consecutive practice days (midnight-to-midnight local time); displays current streak and best streak. See specs/dashboard-home.md.
- [ ] Create `src/components/dashboard/LastSessionCard.tsx` — shows most recent `SessionRecord` (name, date/time, duration, techniques, depth, mood change); "No sessions yet" empty state; taps to session record. See specs/dashboard-home.md.
- [ ] Create `src/components/dashboard/Recommendations.tsx` — rule-based: 0-2 sessions → suggest Beginner Relaxation; post-beginner → suggest variety; never used builder → recommend builder; low depth → suggest different inductions; consistent practice → encourage advancing. Renders 1-3 suggestion cards. See specs/dashboard-home.md.
- [ ] Create `src/components/dashboard/QuickLauncher.tsx` — prominent "Start Session" button; shows last-used session as quick-repeat; links to `/session` for full selection. See specs/dashboard-home.md.
- [ ] Implement `app/page.tsx` — full dashboard layout: greeting, `StreakCounter`, `LastSessionCard`, `Recommendations`, `QuickLauncher`; data from IndexedDB via `useLiveQuery`. See specs/dashboard-home.md.

---

## Phase 2 — Audio Playback (See specs/audio-playback.md)

- [ ] Create `src/content/audio/manifest.json` — maps `sessionId + phaseId + segmentIndex` to audio file paths (can be empty initially; structure must be correct). See specs/audio-playback.md.
- [ ] Create `src/lib/session/audioManager.ts` — manages audio playback queue; preloads next phase; methods: `loadSession`, `playSegment`, `pause`, `resume`, `seek`, `stop`; emits `onSegmentEnd`, `onPhaseEnd`, `onError`; falls back to text-only on error. See specs/audio-playback.md.
- [ ] Create `src/components/session/AudioPlayer.tsx` — play/pause button; progress bar with seek; current/total time; integrated into session page. See specs/audio-playback.md.
- [ ] Integrate `audioManager` with session engine: when audio available, segment advance triggered by `onSegmentEnd`; fallback to `durationSeconds` when unavailable. See specs/audio-playback.md.
- [ ] Add `workbox-range-requests` plugin to Serwist service worker config for Safari audio seek compatibility. See specs/audio-playback.md.
- [ ] Add cache-first strategy for `src/content/audio/**` in service worker. See specs/audio-playback.md.

---

## Phase 2 — Journal (See specs/journal.md)

- [ ] Create `src/components/journal/MoodDepthPicker.tsx` — reusable 1-5 scale picker (emoji or slider); used for mood-before, mood-after, depth rating. See specs/journal.md.
- [ ] Create `src/components/journal/JournalEditor.tsx` — plain-text textarea; `MoodDepthPicker` for before/after mood and depth; tags input; optional technique notes; saves `JournalEntry` to IndexedDB. See specs/journal.md.
- [ ] Add post-session journal prompt to `SessionSummary.tsx` — "Would you like to journal?" with pre-filled `sessionId`; optional, skippable. See specs/journal.md.
- [ ] Implement `app/journal/page.tsx` — chronological list of `JournalEntry` records (newest first); entry cards with date, mood, depth, first line, tags; tag filter; tap to view. See specs/journal.md.
- [ ] Implement `app/journal/[entryId]/page.tsx` — full entry display; edit mode toggle; delete with confirmation. See specs/journal.md.
- [ ] Create `app/journal/new/page.tsx` — standalone journal entry creation (not session-linked). See specs/journal.md.

---

## Phase 3 — Suggestion Builder (See specs/suggestion-builder.md)

- [ ] Add `CustomSuggestion` type to `src/types/index.ts` (id, goalArea, text, score, tags, isFavourite, usageCount, createdAt). See specs/suggestion-builder.md.
- [ ] Create `src/lib/suggestions/validator.ts` — heuristic checks: positive framing (negation regex), present tense (future-tense regex), specificity (word count < 4); returns per-criteria pass/fail + numeric score 0-5. See specs/suggestion-builder.md.
- [ ] Create `src/components/suggestions/GoalAreaPicker.tsx` — 8 goal areas as large tap targets with icons; one required. See specs/suggestion-builder.md.
- [ ] Create `src/components/suggestions/SuggestionEditor.tsx` — textarea; example chips per goal area (chips insert text); optional `SpeechRecognition` voice input (hidden if unsupported). See specs/suggestion-builder.md.
- [ ] Create `src/components/suggestions/GuidelineChecklist.tsx` — 5 criteria with pass/fail indicators; user toggles for "believable" and "emotionally engaging"; star score display; save disabled below score 3. See specs/suggestion-builder.md.
- [ ] Create `src/components/suggestions/SuggestionPreview.tsx` — session-styled text preview; tags input; favourite toggle; save button → writes `CustomSuggestion` to IndexedDB. See specs/suggestion-builder.md.
- [ ] Implement `app/suggestions/builder/page.tsx` — 4-step wizard with step indicator and back/next navigation. See specs/suggestion-builder.md.
- [ ] Implement `app/suggestions/page.tsx` — list all saved suggestions; filter by goal area; sort by usage count or date; favourite filter; tap to edit; delete button. See specs/suggestion-builder.md.

---

## Phase 3 — Settings & Notifications (See specs/settings-notifications.md)

- [ ] Create `src/hooks/useNotifications.ts` — requests Web Notifications permission; schedules daily reminder via Notification API; stores `notificationsEnabled` and `notificationTime` in `UserSettings`; in-app banner fallback when app opened after scheduled time. See specs/settings-notifications.md.
- [ ] Create `src/components/settings/Statistics.tsx` — aggregates `SessionRecord` data: total sessions, total time, average duration, most-used techniques, average depth, sessions/week. See specs/settings-notifications.md.
- [ ] Implement `app/settings/page.tsx` — default duration slider (10-45 min); preferred techniques multi-select; theme toggle (light/dark/system); notifications section; data export; clear data; `Statistics` component. See specs/settings-notifications.md.
- [ ] Implement data export: serialize all IndexedDB tables to JSON and trigger browser download via `Blob` + `URL.createObjectURL`. See specs/settings-notifications.md.
- [ ] Implement clear data with double-confirmation dialog ("Are you sure?" → "This cannot be undone"). See specs/settings-notifications.md.
- [ ] Implement Tailwind dark mode toggle: persist `theme` to `UserSettings`; apply `dark` class to `<html>` via `useEffect`. See specs/settings-notifications.md.

---

## Phase 3 — Additional Guided Sessions (See specs/guided-sessions.md)

- [ ] Create `src/content/sessions/pain-management.json` — full 5-phase script (~25 min); techniques: visualisation, breathing, autogenic; glove anaesthesia suggestion; pain dial metaphor. See specs/guided-sessions.md.
- [ ] Create `src/content/sessions/confidence-building.json` — full 5-phase script (~20 min); techniques: eye-fixation, visualisation, countdown; mental rehearsal; anchoring. See specs/guided-sessions.md.
- [ ] Add contextual pain warning modal in `SessionLauncher.tsx` — one-time modal for pain-goal sessions: "Pain can be a symptom of underlying conditions. Ensure you have a medical diagnosis." See specs/safety-onboarding.md.

---

## Phase 3 — Timer Mode (See specs/settings-notifications.md)

- [ ] Add `timer` session type to `src/lib/session/engine.ts` — runs without script segments; shows countdown only; records `SessionRecord` with `type: 'timer'`. See specs/settings-notifications.md.
- [ ] Create timer mode UI in `app/session/page.tsx` — user sets total duration; countdown display; randomly selected technique prompt cards from preferred techniques. See specs/settings-notifications.md.
