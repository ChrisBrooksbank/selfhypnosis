# Safety & Onboarding

## Overview

A 3-screen onboarding flow that gates the entire app. Users must complete a contraindication screening and acknowledge the complementary nature of self-hypnosis before accessing any features. Conditional warnings persist based on screening results.

## References

- `plan.md` → Safety Flow section
- `research.md` → Safety Considerations and Contraindications section

## User Stories

- As a new user, I see a welcome screen explaining what self-hypnosis is and isn't before I can use the app.
- As a user, I complete a 6-question contraindication checklist so the app can warn me appropriately.
- As a user, I acknowledge that self-hypnosis is complementary and does not replace professional treatment.
- As a user with 1-2 risk factors, I see an amber warning banner but can still use all features.
- As a user with 3+ risk factors, I see a red warning and cannot launch sessions (library-only access).

## Requirements

### Screen 1: Welcome

- `src/components/onboarding/WelcomeSlide.tsx`
- App intro: what self-hypnosis is (focused attention, relaxation, self-directed suggestions).
- Myth-busting: not mind control, not sleep, not loss of awareness, user always in control.
- "Get Started" button to proceed.

### Screen 2: Contraindication Form

- `src/components/onboarding/ContraindicationForm.tsx`
- 6 yes/no questions (from research.md contraindications table):
    1. Active psychosis or schizophrenia
    2. Severe dissociative disorders
    3. Uncontrolled epilepsy
    4. Severe PTSD (without professional guidance)
    5. Recent traumatic experience (last 3 months)
    6. Personality disorder affecting reality testing
- Each question has a brief explanation of why it matters.
- Submit button enabled only after all questions answered.

### Screen 3: Acknowledgement

- `src/components/onboarding/SafetyAcknowledgement.tsx`
- Checkbox: "I understand this is complementary and does not replace professional treatment."
- "Complete Setup" button enabled only when checkbox is checked.

### SafetyGate Component

- `src/components/layout/SafetyGate.tsx`
- Wraps the app in root layout.
- Checks IndexedDB for `onboardingComplete` flag.
- If not complete, redirects to `/onboarding`.
- Renders children only when onboarding is complete.

### Conditional Logic

- 0 "Yes" answers → No warnings, full access.
- 1-2 "Yes" answers → Amber warning banner, "Continue with awareness" option, persistent banner in app.
- 3+ "Yes" answers → Red warning, session launch disabled, library-only access.
- Store results in `UserSettings` table: `contraindicationAnswers`, `hasContraindication`, `safetyAcknowledgedAt`.

### Contextual Warnings (during use)

- Pain goal sessions → one-time modal: "Pain can be a symptom of underlying conditions. Please ensure you have a medical diagnosis."
- IBS sessions → reference to NICE/AGA clinical guidelines.
- Emergence phase → always minimum 2 minutes, cannot be skipped (enforced by session engine, not onboarding).

### Hook

- `src/hooks/useOnboardingStatus.ts` — returns `{ isComplete, hasContraindication, riskLevel }`.

## Acceptance Criteria

- [ ] New user (empty IndexedDB) is redirected to onboarding.
- [ ] All 3 screens display correctly and in order.
- [ ] Cannot skip screens or proceed without completing required inputs.
- [ ] Contraindication answers are persisted to IndexedDB.
- [ ] 0 "Yes" → full access, no warning.
- [ ] 1-2 "Yes" → amber banner visible on all pages.
- [ ] 3+ "Yes" → red warning, session launch button disabled.
- [ ] After completing onboarding, app loads normally on refresh.
- [ ] `npm run check` passes.

## Out of Scope

- Editing contraindication answers after onboarding (future settings feature).
- Professional referral links or resources.
