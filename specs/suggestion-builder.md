# Suggestion Builder

## Overview

A 4-step wizard for creating custom self-hypnosis suggestions. Includes goal selection, text input, automated guideline checking with scoring, and preview/save. Suggestions are stored in IndexedDB and can be included in sessions.

## References

- `plan.md` → Custom Suggestion Builder section, Data Model (CustomSuggestion)
- `research.md` → Phase 4: Suggestion (guidelines for effective suggestions)

## User Stories

- As a user, I can create custom suggestions tailored to my personal goals.
- As a user, I get real-time feedback on whether my suggestions follow best practices.
- As a user, I can see a score (0-5) showing how well my suggestion follows guidelines.
- As a user, I can save and manage my custom suggestions for use in sessions.

## Requirements

### Step 1: Choose Goal Area

- `src/components/suggestions/GoalAreaPicker.tsx`
- 8 goal areas displayed as large tap targets with icons.
- One selection required before proceeding.
- Goal areas: stress-anxiety, pain, sleep, habits, performance, ibs, childbirth, general-relaxation.

### Step 2: Write Suggestion

- `src/components/suggestions/SuggestionEditor.tsx`
- Textarea for entering suggestion text.
- Example chips per goal area (tapping inserts text):
    - stress-anxiety: "I am calm and centered", "My mind is clear and peaceful"
    - pain: "My body is comfortable and at ease", "I manage sensation with confidence"
    - sleep: "I drift into deep, restful sleep", "My mind quiets naturally at bedtime"
    - habits: "I choose healthy patterns naturally", "I am in control of my choices"
    - performance: "I am confident and prepared", "I perform at my best with ease"
    - ibs: "My digestive system functions calmly", "I feel comfortable and at ease"
    - childbirth: "My body knows how to birth naturally", "Each surge brings my baby closer"
    - general-relaxation: "I am deeply relaxed and at peace", "Calm flows through my entire body"
- Optional voice input via SpeechRecognition API (progressive enhancement — hide if unsupported).

### Step 3: Guideline Checker

- `src/lib/suggestions/validator.ts`
- **Auto-detected** (regex/heuristic):
    - **Positive framing**: Check for negation words (not, don't, won't, can't, never, no, stop, avoid, without). Flag if found.
    - **Present tense**: Check for future constructions (will, going to, shall, will be). Flag if found.
    - **Specific**: Word count heuristic — suggestions under 4 words flagged as too vague.
- **User-rated** (toggles):
    - **Believable**: "Does this feel realistic to you right now?"
    - **Emotionally engaging**: "Does this connect to a feeling?"
- Score: 0-5 (one point per guideline met). Displayed as filled stars.
- Score ≥ 3: save enabled.
- Score < 3: gentle improvement prompt with specific suggestions for fixing flagged issues.
- `src/components/suggestions/GuidelineChecklist.tsx` — visual display of all 5 criteria with pass/fail indicators.

### Step 4: Preview & Save

- `src/components/suggestions/SuggestionPreview.tsx`
- Shows suggestion as it would appear during a session (styled text, phase context).
- Add tags input (free-text tags).
- Favourite toggle.
- Save button → writes `CustomSuggestion` to IndexedDB.

### Suggestion List Page

- `app/suggestions/page.tsx`
- Lists all saved suggestions.
- Filter by goal area, sort by usage count or date.
- Tap to edit, swipe/button to delete.
- Favourite filter.

### Builder Page

- `app/suggestions/builder/page.tsx`
- Hosts the 4-step wizard with step indicator.
- Back/Next navigation between steps.

## Acceptance Criteria

- [ ] 4-step wizard navigates forward and back correctly.
- [ ] Goal area selection required before step 2.
- [ ] Example chips insert text into editor.
- [ ] Validator correctly detects negation words (flags "I am not anxious").
- [ ] Validator correctly detects future tense (flags "I will be calm").
- [ ] Validator correctly flags very short suggestions (< 4 words).
- [ ] User toggles for believable and emotionally engaging work.
- [ ] Score displays as 0-5 stars, save disabled below 3.
- [ ] Saved suggestions appear in suggestion list page.
- [ ] Suggestions persist across app reloads (IndexedDB).
- [ ] `npm run check` passes.

## Out of Scope

- Voice input (progressive enhancement, not required for MVP).
- Suggestion usage tracking in sessions (wired up when session engine integrates).
- AI-powered suggestion improvement.
