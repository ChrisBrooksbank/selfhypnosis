# CLAUDE.md

This file provides guidance to Claude Code when working with this codebase.

## Project Overview

Offline-first self-hypnosis PWA. No backend — all data stored in IndexedDB via Dexie.js. Built with Next.js (App Router, static export), Tailwind CSS, and TypeScript.

## Development Commands

```bash
npm run dev            # Next.js dev server (Turbopack)
npm run build          # Production build (static export to out/)
npm run start          # Serve production build
npm test               # Vitest watch mode
npm run test:run       # Run tests once
npm run test:coverage  # Coverage report
npm run lint           # Next.js ESLint check
npm run lint:fix       # ESLint auto-fix
npm run format         # Prettier format all files
npm run typecheck      # TypeScript type check
npm run knip           # Find unused code
npm run check          # Run all checks (typecheck + lint + format + knip)
```

## Architecture

### Next.js App Router with Static Export

- `output: 'export'` in next.config.mjs — no server, fully static
- Pages in `app/` directory, application code in `src/`
- PWA manifest via native `app/manifest.ts`

### Path Aliases

```typescript
@/*           → src/*
@api/*        → src/api/*
@core/*       → src/core/*
@utils/*      → src/utils/*
@config/*     → src/config/*
@types/*      → src/types/*
@components/* → src/components/*
@hooks/*      → src/hooks/*
@lib/*        → src/lib/*
```

### Key Patterns

Use Logger instead of console.log:

```typescript
import { Logger } from '@utils/logger';
Logger.info('Message');
Logger.warn('Warning');
Logger.error('Error');
Logger.success('Done');
Logger.debug('Debug'); // Only in debug mode
```

Config is loaded asynchronously and validated with Zod:

```typescript
import { loadConfig, getConfig } from '@config';
await loadConfig();
const config = getConfig();
```

Retry logic for flaky operations:

```typescript
import { retryWithBackoff } from '@utils/helpers';
const data = await retryWithBackoff(() => fetchData());
```

### Domain Types

Defined in `src/types/index.ts`:

- `TechniqueId` — 7 techniques from research.md
- `GoalArea` — 8 application areas
- `PhaseId` — 5 session phases (preparation → induction → deepening → suggestion → emergence)

### Key Files

- `research.md` — Authoritative source for all content (techniques, protocols, safety, citations)
- `plan.md` — Implementation plan with phased delivery
- `src/config/schema.ts` — Zod schema for app configuration
- `src/utils/logger.ts` — Centralized logging
- `src/utils/helpers.ts` — retry, debounce, throttle, IntervalManager
