# AGENTS.md — Operational Guide for Build Agents

## Commands

```bash
npm run dev            # Dev server (Turbopack)
npm run build          # Production build (static export to out/)
npm test               # Vitest watch mode
npm run test:run       # Run tests once
npm run lint           # ESLint check
npm run lint:fix       # ESLint auto-fix
npm run format         # Prettier format all files
npm run typecheck      # TypeScript type check
npm run knip           # Find unused code
npm run check          # ALL checks (typecheck + lint + format + knip) — run after every task
```

## Project Structure

- `app/` — Next.js App Router pages (layout.tsx, page.tsx, manifest.ts)
- `src/components/` — React components (layout/, session/, library/, suggestions/, journal/, onboarding/, ui/)
- `src/lib/` — Core logic (db.ts, session/engine.ts, session/phaseConfig.ts, session/audioManager.ts, suggestions/validator.ts, safety/contraindications.ts)
- `src/hooks/` — React hooks (useSessionEngine, useOnboardingStatus, useNotifications)
- `src/content/` — Static JSON data (techniques/, sessions/, audio/)
- `src/types/index.ts` — Domain types: TechniqueId, GoalArea, PhaseId
- `src/config/` — Zod-validated config (schema.ts, index.ts)
- `src/utils/` — Logger, helpers (retry, debounce, throttle)

## Path Aliases

```
@/*           → src/*
@components/* → src/components/*
@lib/*        → src/lib/*
@hooks/*      → src/hooks/*
@types/*      → src/types/*
@config/*     → src/config/*
@utils/*      → src/utils/*
```

## Patterns

**Logging** — Use Logger, never console.log:

```typescript
import { Logger } from '@utils/logger';
Logger.info('msg');
Logger.warn('msg');
Logger.error('msg');
```

**Config** — Async load, Zod-validated:

```typescript
import { loadConfig, getConfig } from '@config';
await loadConfig();
const config = getConfig();
```

**Database** — Dexie.js for IndexedDB:

```typescript
import { db } from '@lib/db';
```

**Static export** — `output: 'export'` in next.config.mjs. No server APIs. All data in IndexedDB.

## Key Rules

- TypeScript strict mode. No `any` types.
- All files must pass `npm run check` before committing.
- One task per iteration. Keep changes focused.
