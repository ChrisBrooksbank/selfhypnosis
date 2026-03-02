# Dashboard & Home Screen

## Overview

The home screen serves as the app's landing page after onboarding. Shows practice streak, last session summary, personalized recommendations, and a quick session launcher.

## References

- `plan.md` → Phase 2 (Home dashboard: streak counter, last session, recommendations)
- `research.md` → Tips for Beginners #3 ("Practise consistently"), #1 ("Be patient")

## User Stories

- As a user, I see my practice streak so I'm motivated to practise daily.
- As a user, I see a summary of my last session so I can track continuity.
- As a user, I get recommendations for what to try next based on my history.
- As a user, I can quickly launch a session from the home screen.

## Requirements

### Streak Counter

- `src/components/dashboard/StreakCounter.tsx`
- Counts consecutive days with at least one completed session.
- Displays current streak number prominently.
- Shows "best streak" record.
- Streak resets if a day is missed (midnight-to-midnight in local time).

### Last Session Card

- `src/components/dashboard/LastSessionCard.tsx`
- Shows: session name, date/time, duration, techniques used, depth rating, mood change.
- "No sessions yet" state for new users.
- Tap to view full session record.

### Recommendations

- `src/components/dashboard/Recommendations.tsx`
- Simple rule-based recommendations (not ML):
    - New user (0-2 sessions): suggest Beginner Relaxation.
    - Has completed beginner sessions: suggest trying different techniques or goal areas.
    - Hasn't tried suggestion builder: recommend creating custom suggestions.
    - Low depth ratings: suggest trying different induction techniques.
    - Consistent practice: encourage and suggest advancing to intermediate content.
- Displayed as 1-3 card suggestions with action buttons.

### Quick Session Launcher

- `src/components/dashboard/QuickLauncher.tsx`
- "Start Session" prominent button.
- Shows last-used session as a quick-repeat option.
- Links to full session launcher for more options.

### Home Page

- `app/page.tsx`
- Layout: greeting, streak counter, last session card, recommendations, quick launcher.
- Responsive: single column on mobile, wider cards on tablet/desktop.
- Pulls data from IndexedDB via Dexie `useLiveQuery`.

## Acceptance Criteria

- [ ] Home page renders with all sections.
- [ ] Streak counter correctly calculates consecutive practice days.
- [ ] Last session card shows accurate data from most recent SessionRecord.
- [ ] Recommendations change based on user's session history.
- [ ] Quick launcher navigates to session flow.
- [ ] Empty state renders correctly for new users.
- [ ] `npm run check` passes.

## Out of Scope

- Graphs/charts of progress over time.
- Social features or sharing.
- Push notification triggers from home screen.
