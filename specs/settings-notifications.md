# Settings & Notifications

## Overview

User preferences, data export, notification scheduling, timer mode for freestyle practice, and session statistics. The settings page is the central control panel for customizing the app experience.

## References

- `plan.md` → Phase 3 (Timer mode, Notifications, Settings), Data Model (UserSettings)
- `research.md` → Tips for Beginners #3 (consistency), #6 (choosing right time)

## User Stories

- As a user, I can set my preferred session duration and techniques.
- As a user, I can export all my data as JSON for backup.
- As a user, I can schedule reminders to practise regularly.
- As a user, I can use a timer-only mode for freestyle practice without scripts.
- As a user, I can see my overall practice statistics.

## Requirements

### Preferences

- `app/settings/page.tsx`
- Default session duration (slider: 10-45 minutes).
- Preferred techniques (multi-select from 7 techniques).
- Theme: light/dark/system (Tailwind dark mode).
- Data management section (export, clear).

### Data Export

- Export all IndexedDB data as a single JSON file.
- Includes: settings, session records, suggestions, journal entries.
- Download triggered via `Blob` + `URL.createObjectURL`.
- Clear all data option with double-confirmation ("Are you sure?" → "This cannot be undone").

### Notification Scheduling

- `src/hooks/useNotifications.ts`
- Request Web Notifications API permission.
- Schedule daily reminder at user-chosen time.
- Implementation: since true scheduled notifications aren't available on iOS, use:
    - Web Notifications API where supported (Chrome, Firefox).
    - In-app reminder banner as fallback (shown when app is opened after scheduled time).
- Store `notificationsEnabled` and `notificationTime` in UserSettings.

### Timer Mode (Phase 3)

- Freestyle practice mode without guided scripts.
- User sets total duration.
- Shows: countdown timer, technique prompt cards (randomly selected from preferred techniques).
- Minimal UI — just timer and optional technique suggestions.
- Still records a SessionRecord (type: 'timer') for streak tracking.

### Session Statistics

- `src/components/settings/Statistics.tsx`
- Total sessions completed.
- Total practice time.
- Average session duration.
- Most-used techniques.
- Average depth rating.
- Practice frequency (sessions per week).
- All calculated from SessionRecord data in IndexedDB.

### User Settings Data Model

```typescript
{
  id: 'user';                          // single record
  onboardingComplete: boolean;
  safetyAcknowledgedAt?: string;       // ISO date
  contraindicationAnswers: boolean[];  // 6 answers
  hasContraindication: boolean;
  riskLevel: 'none' | 'amber' | 'red';
  notificationsEnabled: boolean;
  notificationTime?: string;           // HH:MM format
  defaultSessionDuration: number;      // minutes
  preferredTechniques: TechniqueId[];
  theme: 'light' | 'dark' | 'system';
}
```

## Acceptance Criteria

- [ ] Settings page renders with all preference controls.
- [ ] Default duration and preferred techniques save to IndexedDB.
- [ ] Theme toggle switches between light/dark/system.
- [ ] Data export downloads a valid JSON file with all data.
- [ ] Clear data requires double confirmation and wipes IndexedDB.
- [ ] Notification permission request works on supported browsers.
- [ ] In-app reminder fallback shows on schedule.
- [ ] Timer mode runs with countdown and technique prompts.
- [ ] Timer sessions are recorded in IndexedDB.
- [ ] Statistics display accurate aggregated data.
- [ ] `npm run check` passes.

## Out of Scope

- Import data from JSON.
- Cloud sync or cross-device transfer.
- Advanced scheduling (multiple reminders per day).
- Offline audio pre-caching toggle (Phase 4).
