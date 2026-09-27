# Academia Arcana

Academia Arcana is a Next.js application organized as a modular monolith. The technical foundation is intentionally kept separate from product feature work so that future domains can evolve behind explicit boundaries.

## Stack

- Next.js + App Router
- React
- TypeScript (strict)
- Tailwind CSS (planned for the presentation layer)
- Lucide React
- Supabase (authentication and data integration)
- Vitest + Testing Library
- ESLint
- GitHub Actions

## Architecture

The approved domain boundaries are:

`identity`, `context`, `authorization`, `learning`, `planning`, `gamification`, `education`, `social`, `adaptive`, `intelligence`, `flonts`, `trust`, `data`, `sanctuary`.

The foundation keeps core contracts independent from presentation and infrastructure concerns.

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

## Environment

Copy `.env.example` to `.env.local` only when the corresponding integration is enabled. Never commit local environment files or secrets.

## Runtime

The repository standardizes on Node.js 24 (`.nvmrc`, `package.json` `engines`, and CI).
