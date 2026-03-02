# Technique Library

## Overview

A browseable library of 7 self-hypnosis techniques with index page, detail pages, search, and filtering. Content is sourced from research.md and stored as static JSON files.

## References

- `plan.md` → Technique Library section, Project Structure (content/techniques/)
- `research.md` → Core Techniques section (all 7 techniques)

## User Stories

- As a user, I can browse all 7 techniques in a card grid so I can discover what's available.
- As a user, I can search techniques by name or keyword.
- As a user, I can filter techniques by goal area to find relevant ones.
- As a user, I can tap a technique card to see a detailed page with how-to steps, science, and an option to try it.

## Requirements

### Technique JSON Files

- `src/content/techniques/{techniqueId}.json` — one file per technique.
- Schema per file:
    ```typescript
    {
      id: TechniqueId;
      name: string;
      tagline: string;
      difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
      goalAreas: GoalArea[];
      overview: string; // markdown
      steps: { number: number; instruction: string; duration?: string }[];
      scienceBlurb: string;
      citations: string[];
      relatedTechniques: TechniqueId[];
    }
    ```
- Content derived from research.md Core Techniques section.
- The 7 techniques: eye-fixation, pmr, visualisation, countdown, breathing, 321-sensory, autogenic.

### Library Index Page (`/library`)

- `app/library/page.tsx`
- Search input at top — filters by name and tagline.
- Goal-area filter chips below search — toggleable, multiple selectable.
- Responsive 2-column card grid (1 column on small phones).
- `src/components/library/TechniqueCard.tsx` — card showing name, tagline, difficulty badge, goal-area tags.

### Technique Detail Page (`/library/[techniqueId]`)

- `app/library/[techniqueId]/page.tsx`
- `generateStaticParams` returning all 7 technique IDs.
- 3-tab layout:
    1. **How it Works** — overview (rendered markdown) + numbered steps list.
    2. **The Science** — science blurb + citations list.
    3. **Try It** — inline mini-session (text-only instructions, no audio in MVP). Step-by-step with "Next" button.
- `src/components/library/TechniqueDetail.tsx` — main detail component.
- `src/components/library/SciencePanel.tsx` — science tab content.

### Type Definition

- Add `Technique` type to `src/types/index.ts` or co-locate with content loader.

## Acceptance Criteria

- [ ] All 7 technique JSON files exist with complete content from research.md.
- [ ] Library index loads all techniques and displays cards.
- [ ] Search filters cards by name/tagline in real time.
- [ ] Goal-area filter chips filter correctly (intersection: technique must match at least one selected area).
- [ ] Detail page renders all 3 tabs with correct content.
- [ ] "Try It" tab shows step-by-step walkthrough.
- [ ] `generateStaticParams` produces pages for all 7 techniques.
- [ ] `npm run check` passes.

## Out of Scope

- Audio for "Try It" mini-sessions (Phase 3).
- Favouriting techniques.
- Technique usage analytics.
