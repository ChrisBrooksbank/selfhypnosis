# Self-Hypnosis

Guided self-hypnosis PWA — technique library, session engine, and personal suggestion builder. Offline-first, no backend, all data stays on your device.

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command                 | Description                          |
| ----------------------- | ------------------------------------ |
| `npm run dev`           | Start Next.js dev server (Turbopack) |
| `npm run build`         | Production build (static export)     |
| `npm run start`         | Serve production build locally       |
| `npm test`              | Run tests in watch mode              |
| `npm run test:run`      | Run tests once                       |
| `npm run test:coverage` | Generate coverage report             |
| `npm run lint`          | Check for lint errors                |
| `npm run lint:fix`      | Fix lint errors                      |
| `npm run format`        | Format code with Prettier            |
| `npm run typecheck`     | TypeScript type checking             |
| `npm run knip`          | Find unused code                     |
| `npm run check`         | Run all checks                       |

## Project Structure

```
app/                    # Next.js App Router pages
  layout.tsx            # Root layout
  page.tsx              # Home / dashboard
  manifest.ts           # PWA manifest
src/
  api/                  # External API clients
  core/                 # Core business logic (session engine, etc.)
  config/               # Zod-validated configuration
  utils/                # Logger, helpers (retry, debounce, throttle)
  types/                # Shared TypeScript types
content/                # Static technique/session JSON files
public/                 # Static assets, PWA icons
```

## License

MIT
