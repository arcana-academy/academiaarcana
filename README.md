# Academia Arcana

Academia Arcana is a Next.js application organized as a modular monolith. The technical foundation is intentionally kept separate from product feature work so that future domains can evolve behind explicit boundaries.

## Stack

- Next.js + App Router
- React
- TypeScript (strict)
- Tailwind CSS
- Lucide React
- Supabase (authentication and data integration)
- Vitest + Testing Library
- ESLint
- GitHub Actions

## Architecture

Academia Arcana uses a modular-monolith architecture with explicit domain, application, port, and infrastructure boundaries.

The approved domain boundaries are:

`identity`, `context`, `authorization`, `learning`, `planning`, `gamification`, `education`, `social`, `adaptive`, `intelligence`, `flonts`, `trust`, `data`, `sanctuary`.

The foundation keeps core contracts independent from presentation and infrastructure concerns.

**Canonical operational architecture:** `docs/architecture/AA-ARCHITECTURE-1.0.md`

The older design specification in `docs/superpowers/specs/2026-08-31-academia-arcana-architecture-design.md` remains the conceptual/strategic record; the operational baseline is authoritative for the current repository.

## Development

```bash
npm ci
npm run dev
```

## Quality Gate

```bash
npm run lint
npm run typecheck
npm test
npm run test:a11y
npm run build
npm run test:e2e
```

CI executes the same quality sequence on pushes to `main`, `feat/**`, and `chore/**`, and on pull requests targeting `main`.

## Deployment

Render is the sole hosting and application deployment platform for Academia Arcana.

Repository deployment contract:
- infrastructure definition: `render.yaml`;
- production runtime: Render Web Service running the Next.js Node.js server;
- build: `npm ci && npm run build`;
- start: `npm start`;
- health check: `/api/health`;
- CI and validation: GitHub Actions;
- persistence/authentication: Supabase.

Vercel and GitHub Pages are not deployment targets for this repository.

## Environment

Copy `.env.example` to `.env.local` only when the corresponding integration is enabled. Never commit local environment files or secrets.

## Runtime

The repository standardizes on Node.js 24 (`.nvmrc`, `package.json` `engines`, and CI).
