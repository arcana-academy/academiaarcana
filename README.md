# Academia Arcana

Academia Arcana is a Next.js application organized as a modular monolith. The technical foundation is intentionally kept separate from product feature work so that future domains can evolve behind explicit boundaries.

## Stack

- Next.js + App Router
- React
- TypeScript (strict)
- Tailwind CSS (planned for the presentation layer)
- Lucide React
- Supabase (integration boundary reserved for auth/data work)
- Vitest + Testing Library
- ESLint
- GitHub Actions

## Architecture

The approved domain boundaries are:

`identity`, `context`, `authorization`, `learning`, `planning`, `gamification`, `education`, `social`, `adaptive`, `intelligence`, `flonts`, `trust`, `data`.

The foundation keeps core contracts independent from presentation and infrastructure concerns.

## Development

```bash
npm install
npm run dev
```

## Quality Gate

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

CI executes the same quality sequence on pushes to `main` and `feat/**`, and on pull requests targeting `main`.

## Environment

Copy `.env.example` to `.env.local` only when the corresponding integration is enabled. Never commit local environment files or secrets.

## Runtime

The repository standardizes on Node.js 22 (`.nvmrc` and CI).
