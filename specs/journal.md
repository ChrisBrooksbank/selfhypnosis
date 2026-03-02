# Journal

## Overview

Post-session journaling with mood/depth tracking, entry list, and editor. Linked to sessions when created from the session summary flow, or standalone for general reflection.

## References

- `plan.md` → Phase 2 (Journal), Data Model (JournalEntry, SessionRecord mood/depth fields)
- `research.md` → Tips for Beginners #7 ("Keep a journal")

## User Stories

- As a user, I can write a journal entry after a session to record my experience.
- As a user, I can rate my mood before/after and depth of trance.
- As a user, I can browse past journal entries to track my progress.
- As a user, I can create standalone journal entries not linked to a session.

## Requirements

### Post-Session Journal Prompt

- After session summary (depth/mood ratings), prompt: "Would you like to journal about this session?"
- Pre-fills `sessionId` link when created from a session.
- Optional — user can skip.

### Journal Entry Editor

- `src/components/journal/JournalEditor.tsx`
- Rich text area (plain text with line breaks, not a WYSIWYG editor).
- Mood picker: before (1-5) and after (1-5) using emoji or slider.
    - `src/components/journal/MoodDepthPicker.tsx` — reusable 1-5 picker component.
- Depth rating: 1-5 scale (how deep the trance felt).
- Tags input (free-text tags for categorization).
- Technique notes: optional textarea for notes about specific techniques tried.
- Save to IndexedDB `journal` table.

### Journal Entry List

- `app/journal/page.tsx`
- Chronological list of entries (newest first).
- Each entry card shows: date, mood before→after, depth, first line of body text, tags.
- Filter by tag.
- Tap to view/edit.

### Journal Entry View/Edit

- `app/journal/[entryId]/page.tsx`
- Full entry display with all fields.
- Edit mode toggled by button.
- Delete with confirmation.

### Data Model

- `JournalEntry` in IndexedDB:
    ```typescript
    {
      id: string;          // UUID
      sessionId?: string;  // nullable link to SessionRecord
      body: string;
      moodBefore?: number; // 1-5
      moodAfter?: number;  // 1-5
      depthRating?: number; // 1-5
      tags: string[];
      techniqueNotes?: string;
      createdAt: string;   // ISO date
      updatedAt: string;   // ISO date
    }
    ```

## Acceptance Criteria

- [ ] Journal editor saves entries to IndexedDB.
- [ ] Mood/depth pickers work with 1-5 scale.
- [ ] Entry list displays chronologically with correct metadata.
- [ ] Entries linked to sessions show session reference.
- [ ] Standalone entries can be created from journal page.
- [ ] Edit and delete work correctly.
- [ ] Tag filtering works on the list page.
- [ ] `npm run check` passes.

## Out of Scope

- Mood trend charts/graphs (future enhancement).
- Export journal entries.
- Rich text formatting.
