# Self-Hypnosis PWA — Implementation Plan

## Context

We have a comprehensive self-hypnosis research report (`research.md`) covering 7 techniques, a 5-phase session protocol, 7 application areas, safety contraindications, and suggestion guidelines. The goal is to build an offline-first PWA that turns this research into an interactive tool for users of all experience levels — guided sessions for beginners, a custom suggestion builder for advanced users, and a technique library for education.

**Key architectural choice: no backend.** All data stays on-device (IndexedDB). This is the strongest trust signal for a mental health-adjacent tool — "your data never leaves your device" — and eliminates GDPR/hosting concerns.

---

## Tech Stack

| Layer                | Choice                                       | Rationale                                                                                  |
| -------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Framework            | Next.js (App Router) with `output: 'export'` | Static export = no server needed, CDN-deployable, perfect for offline PWA                  |
| PWA / Service Worker | **Serwist** (`@serwist/next`)                | Modern successor to `next-pwa`, built on Workbox, recommended by Next.js docs              |
| Manifest             | `app/manifest.ts` (native Next.js)           | Built-in App Router feature, no extra package                                              |
| IndexedDB            | **Dexie.js**                                 | Schema versioning, `useLiveQuery` React hook for reactive UI, excellent TypeScript support |
| Audio caching        | Serwist + `workbox-range-requests`           | Required for offline audio playback with seeking (especially Safari)                       |
| Styling              | Tailwind CSS                                 | Fast prototyping, small bundle, good PWA defaults                                          |
| Notifications        | Web Notifications API (best-effort)          | No true scheduled notifications on iOS; in-app reminders as fallback                       |

**Note:** Serwist currently requires Webpack (not Turbopack). Build config must specify this.

---

## Project Structure

```
selfhypnosis/
├── app/
│   ├── layout.tsx                 # Root layout, SafetyGate wrapper
│   ├── manifest.ts                # PWA manifest (native Next.js)
│   ├── sw.ts                      # Serwist service worker
│   ├── page.tsx                   # Home / dashboard
│   ├── onboarding/
│   │   └── page.tsx               # Welcome + safety screening (multi-step)
│   ├── library/
│   │   ├── page.tsx               # Technique index (7 techniques)
│   │   └── [techniqueId]/
│   │       └── page.tsx           # Technique detail (overview, steps, science)
│   ├── session/
│   │   ├── page.tsx               # Session launcher (guided / timer / custom)
│   │   └── [sessionId]/
│   │       └── page.tsx           # Active session player (full-screen)
│   ├── suggestions/
│   │   ├── page.tsx               # Saved suggestions list
│   │   └── builder/
│   │       └── page.tsx           # 4-step suggestion builder wizard
│   ├── journal/
│   │   ├── page.tsx               # Journal entry list + mood trends
│   │   └── [entryId]/
│   │       └── page.tsx           # Entry view/edit
│   └── settings/
│       └── page.tsx               # Preferences, notifications, data export
│
├── components/
│   ├── layout/        # BottomNav, PageHeader, SafetyGate
│   ├── session/       # PhaseDisplay, PhaseTimer, ScriptDisplay, AudioPlayer,
│   │                  # EmergencePrompt, SessionSummary, SessionLauncher
│   ├── library/       # TechniqueCard, TechniqueDetail, SciencePanel
│   ├── suggestions/   # SuggestionBuilder, GuidelineChecklist, SuggestionPreview
│   ├── journal/       # JournalEntry, MoodDepthPicker
│   ├── onboarding/    # WelcomeSlides, ContraindicationForm, SafetyAcknowledgement
│   └── ui/            # Button, Card, Modal, Progress, Slider, Toggle
│
├── lib/
│   ├── db.ts                      # Dexie database definition + all entity types
│   ├── session/
│   │   ├── engine.ts              # Session state machine (finite states per phase)
│   │   ├── phaseConfig.ts         # Phase definitions, default durations
│   │   └── audioManager.ts        # Audio queue, preloading, Web Audio API
│   ├── suggestions/
│   │   └── validator.ts           # Auto-detect positive/present-tense; score 0-5
│   └── safety/
│       └── contraindications.ts   # Checklist definitions, conditional logic
│
├── content/
│   ├── techniques/                # 7 static JSON files (one per technique)
│   ├── sessions/                  # Pre-built guided session scripts (JSON)
│   └── audio/                     # Pre-generated TTS audio files + manifest.json
│
├── hooks/
│   ├── useSessionEngine.ts        # React wrapper around session state machine
│   ├── useOnboardingStatus.ts     # Checks if safety screening complete
│   └── useNotifications.ts        # Permission + best-effort scheduling
│
└── public/
    ├── icons/                     # PWA icons (192, 384, 512px)
    └── screenshots/               # PWA install screenshots
```

---

## Data Model (Dexie.js / IndexedDB)

### Entities

**UserSettings** (single record, key `"user"`)

- `onboardingComplete`, `safetyAcknowledgedAt`, `contraindicationAnswers`, `hasContraindication`
- `notificationsEnabled`, `notificationTime`, `defaultSessionDuration`, `preferredTechniques`, `theme`

**SessionRecord** (key: `crypto.randomUUID()`)

- `type` (guided | timer | custom), `templateId`, `goalArea`, `techniquesUsed`
- `plannedDurationMinutes`, `actualDurationSeconds`, `phasesCompleted`
- `suggestionIds`, `completedAt`, `interruptedAt`
- `notes`, `depthRating` (1-5), `moodBefore` (1-5), `moodAfter` (1-5)

**CustomSuggestion** (key: UUID)

- `text`, `goalArea`, `tags`, `validationScore` (0-5)
- `guidelineFlags`: `{ isPositive, isPresentTense, isSpecific, isBelievable, isEmotional }`
- `isFavourite`, `usageCount`, `lastUsedAt`

**JournalEntry** (key: UUID)

- `sessionId` (nullable link), `body`, `tags`, `techniqueNotes`

### Enums

- **TechniqueId**: eye-fixation, pmr, visualisation, countdown, breathing, 321-sensory, autogenic
- **GoalArea**: stress-anxiety, pain, sleep, habits, performance, ibs, childbirth, general-relaxation
- **PhaseId**: preparation, induction, deepening, suggestion, emergence

---

## Session Engine Design

A finite state machine in `lib/session/engine.ts` driven by a 1-second interval tick.

**Phases flow**: idle → preparation → induction → deepening → suggestion → emergence → complete

Each phase has: `defaultMinutes`, `minMinutes`, `maxMinutes`, `scriptSegments[]`, `audioTrackId`, `allowSkip` (emergence is never skippable — safety requirement).

**Script segments** display as timed text (typewriter reveal, then fade to low opacity after 8s so users can close eyes). Audio, when available, drives segment timing. Without audio, the engine uses configured durations.

**Persistence**: session record written to IndexedDB on start (with `completedAt: null`), updated on each phase completion, finalized on end. Interrupted sessions are recoverable on next app open.

---

## Safety Flow

### Onboarding (3 screens, gates the entire app via `SafetyGate`)

1. **Welcome** — App intro, what self-hypnosis is and isn't (myth-busting)
2. **Contraindication Checklist** — 6 yes/no questions mapped from research.md:
    - Active psychosis/schizophrenia
    - Dissociative disorders
    - Uncontrolled epilepsy
    - Severe PTSD
    - Recent traumatic event (last 3 months)
    - Personality disorder affecting reality testing
3. **Acknowledgement** — Checkbox: "I understand this is complementary and does not replace professional treatment"

**Conditional logic:**

- 1-2 "Yes" → Amber warning, "Continue with awareness" allowed, persistent banner throughout app
- 3+ "Yes" → Red warning, session launch disabled, library-only access

### Contextual warnings during use

- Pain goal sessions → one-time modal about medical diagnosis
- IBS sessions → reference to NICE/AGA guidelines
- Emergence phase → always minimum 2 minutes, cannot be skipped

---

## Custom Suggestion Builder (4-step wizard)

1. **Choose goal area** — Large tap targets with icons
2. **Write suggestion** — Textarea with example chips per goal area; optional voice input via SpeechRecognition API
3. **Guideline checker** (core differentiator):
    - **Auto-detected**: Positive framing (regex for negation words), Present tense (regex for future constructions), Specific (word count heuristic)
    - **User-rated**: Believable (toggle), Emotionally engaging (toggle)
    - Score 0-5 displayed as filled stars; 3+ enables save, below 3 shows gentle improvement prompt
4. **Preview & save** — Shows suggestion as it appears during a session; add tags; save to IndexedDB

---

## Technique Library

7 static JSON files in `content/techniques/`, each containing: `name`, `tagline`, `difficultyLevel`, `goalAreas`, `overview` (markdown), `steps[]`, `scienceBlurb`, `citations[]`, `relatedTechniques`.

**Library index** (`/library`): Search input, goal-area filter chips, responsive 2-column card grid.

**Detail page** (`/library/[techniqueId]`): 3 tabs — "How it Works" (overview + numbered steps), "The Science" (research callout + citations), "Try It" (inline mini-session, text-only in MVP).

All pages are statically generated at build time via `generateStaticParams`.

---

## Phased Delivery

### Phase 1 — MVP (Weeks 1-5)

Validates: can a user complete a meaningful guided self-hypnosis session?

- [ ] Next.js App Router scaffold + Serwist PWA setup + Dexie.js
- [ ] Safety onboarding (3 screens, contraindication form, SafetyGate)
- [ ] Technique Library — all 7 technique JSON files, index + detail pages (text-only)
- [ ] Session engine — finite state machine, PhaseTimer, ScriptDisplay
- [ ] 3 guided sessions (text scripts only): Beginner Relaxation, Stress Relief, Sleep Preparation
- [ ] Session summary — depth/mood rating, notes, writes to IndexedDB
- [ ] Bottom nav, all route pages scaffolded
- [ ] IndexedDB stores: settings, sessions

**Deferred**: audio, suggestion builder, journal, notifications

### Phase 2 — Core Features (Weeks 6-9)

- [ ] AI-generated TTS audio for the 3 MVP sessions (ElevenLabs or similar)
- [ ] AudioPlayer + audioManager with offline caching (RangeRequestsPlugin)
- [ ] Custom Suggestion Builder (full 4-step wizard + GuidelineChecklist)
- [ ] Journal (post-session prompts, entry list, editor)
- [ ] SessionLauncher (technique selection, duration control, suggestion inclusion)
- [ ] Home dashboard (streak counter, last session, recommendations)

### Phase 3 — Polish & Expansion (Weeks 10-13)

- [ ] 2 more guided sessions with audio: Pain Management, Confidence Building
- [ ] Timer mode (freestyle practice with technique prompt cards)
- [ ] Notification scheduling (best-effort: Web Notifications + in-app fallback)
- [ ] Application area browsing pages (research evidence per goal area)
- [ ] Settings: data export as JSON, clear data, session statistics
- [ ] Per-technique "Try It" audio guides

### Phase 4 — Enhancement (Post-launch)

- [ ] Drag-and-drop advanced session builder
- [ ] Web Speech API for reading custom suggestions aloud in sessions
- [ ] Full accessibility pass (keyboard nav, ARIA live regions, screen reader)
- [ ] Offline audio pre-caching toggle in settings
- [ ] Multiple script variants per goal area with preference tracking

---

## Verification Plan

1. **PWA install**: Build with `next build`, serve `out/` with `npx serve`, verify installable on Chrome/Android/iOS Safari, verify manifest and icons
2. **Offline**: Install PWA, go airplane mode, verify all pages load, session engine runs, IndexedDB reads/writes work
3. **Safety gate**: Clear IndexedDB, reload — must redirect to onboarding. Complete onboarding, verify access. Check conditional logic with 1-2 and 3+ "yes" answers
4. **Session flow**: Launch a guided session, verify all 5 phases transition correctly, timer counts down, script segments display and fade, emergence cannot be skipped, summary saves to IndexedDB
5. **Audio** (Phase 2): Play a guided session with audio, verify segments sync, pause/resume works, test offline after caching, test seeking on Safari
6. **Suggestion builder** (Phase 2): Create a suggestion, verify guideline auto-detection catches negation/future tense, verify score calculation, verify save to IndexedDB, verify it appears in session launcher
7. **Responsive**: Test on 375px (iPhone SE), 390px (iPhone 14), 768px (iPad), 1440px (desktop)
