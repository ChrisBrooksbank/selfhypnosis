# PWA Shell & App Scaffold

## Overview

The foundational Next.js App Router scaffold with Serwist PWA support, bottom navigation, routing, layout, and responsive design. This is the skeleton that all features mount into.

## References

- `plan.md` → Project Structure, Tech Stack, Phase 1 MVP
- `research.md` → N/A (infrastructure)

## User Stories

- As a user, I can install the app as a PWA on my device so I can access it from my home screen.
- As a user, I can navigate between sections (Home, Library, Session, Journal, Settings) via a bottom navigation bar.
- As a user, I can use the app offline after the first visit.
- As a user, the app looks good on my phone (375px+), tablet (768px), and desktop (1440px).

## Requirements

### Next.js Scaffold

- App Router with `output: 'export'` in next.config.mjs (already configured).
- Root layout (`app/layout.tsx`) wrapping all pages with `<SafetyGate>` and `<BottomNav>`.
- Route pages scaffolded: `/`, `/onboarding`, `/library`, `/library/[techniqueId]`, `/session`, `/session/[sessionId]`, `/suggestions`, `/suggestions/builder`, `/journal`, `/journal/[entryId]`, `/settings`.
- Each page exports a default component with basic layout and heading.

### PWA / Service Worker

- Serwist (`@serwist/next`) integration for service worker generation.
- `app/manifest.ts` returning valid PWA manifest (name, icons, theme_color, display: standalone).
- Service worker (`app/sw.ts`) with precaching of static assets and runtime caching strategies.
- PWA icons in `public/icons/` (192px, 384px, 512px).

### Bottom Navigation

- `src/components/layout/BottomNav.tsx` — fixed bottom bar with 5 tabs: Home, Library, Session, Journal, Settings.
- Active tab highlighted based on current route.
- Icons for each tab (use simple SVG or emoji placeholders initially).
- Hidden during active session playback (full-screen mode).

### Layout & Responsive Design

- `src/components/layout/PageHeader.tsx` — reusable page header with title and optional back button.
- Mobile-first design with Tailwind CSS.
- Safe area padding for notched devices (`env(safe-area-inset-*)`).
- Max content width on desktop (640px or 768px centered).

### Dexie.js Database

- `src/lib/db.ts` — Dexie database definition with tables: `settings`, `sessions`, `suggestions`, `journal`.
- Schema versioning (version 1).
- TypeScript types for each entity matching plan.md data model.

## Acceptance Criteria

- [ ] `npm run build` produces a valid static export in `out/`.
- [ ] App is installable as PWA (valid manifest, service worker registers).
- [ ] All routes render without errors.
- [ ] Bottom nav shows on all pages except during active sessions.
- [ ] Responsive layout works at 375px, 768px, and 1440px widths.
- [ ] `npm run check` passes.

## Out of Scope

- Actual page content (handled by other specs).
- Audio caching strategies (see specs/audio-playback.md).
- Onboarding flow logic (see specs/safety-onboarding.md).
