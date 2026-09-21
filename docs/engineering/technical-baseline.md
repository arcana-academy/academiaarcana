# Academia Arcana — Technical Baseline

## Status

Phase 0 — technical baseline stabilization.

This document defines the supported development/build baseline for the repository. It does not authorize product-feature work.

## Runtime

- Node.js: `22.x`
- Local pin file: `.nvmrc` = `22`
- CI: Node.js `22`
- Vercel: Node.js `22.x` is the intended major version.

Vercel guarantees the Node 22 major line rather than a fixed patch, so the repository standardizes on `22.x` instead of a patch-level Vercel runtime.

## Package Manager

- Official package manager: **npm**
- Required npm version: `11.19.1`
- `package.json#packageManager`: `npm@11.19.1`
- `package.json#engines`: Node `22.x`, npm `11.19.1`
- `package.json#devEngines`: Node `22.x` and npm `11.19.1`, failing on mismatch.

Do not use pnpm as the repository package manager.

## Lockfile

- Official lockfile: `package-lock.json`
- Lockfile format: npm lockfile v3
- No `pnpm-lock.yaml` is present on `main`.
- A second package-manager lockfile must not be introduced.

## Core toolchain

| Technology | Baseline |
|---|---:|
| Next.js | 16.3.5 |
| React | 19.3.0 |
| React DOM | 19.3.0 |
| TypeScript | 6.0.3 |
| ESLint | 9.39.5 |
| eslint-config-next | 16.3.5 |
| typescript-eslint | 8.70.0 (resolved transitively by eslint-config-next) |
| Vitest | 4.1.11 |
| Testing Library React | 16.3.3 |
| Testing Library DOM | 10.4.2 |
| Playwright | 1.63.0 |
| Vite | 7.3.6 |

## TypeScript policy

TypeScript 7 is **not** part of this baseline.

The repository previously contained the TypeScript 7 side-by-side alias:

`@typescript/native = npm:typescript@^7.0.2`

That alias was removed from the baseline because the resolved `typescript-eslint` 8.70.0 stack declares TypeScript support as `>=4.8.4 <6.1.0`. TypeScript 6.0.3 remains inside that supported range.

The baseline therefore uses the ordinary `typescript@6.0.3` package directly. No TypeScript 6/7 side-by-side installation is permitted for this phase.

## CI rules

The Quality Gate must:

1. run on Node 22;
2. install npm 11.19.1 explicitly;
3. use `npm ci`;
4. avoid `--force`;
5. avoid `--legacy-peer-deps`;
6. avoid installing a second Playwright version outside the lockfile;
7. run typecheck;
8. run lint;
9. run unit tests;
10. run accessibility tests;
11. run the production build;
12. run the E2E suite using the Playwright version declared in `package.json`.

## Vercel

The current production deployment is attached to the same `main` commit used for this baseline audit and is READY.

The repository should keep Vercel aligned with:

- Node 22.x;
- npm/package-lock resolution;
- the repository build script `npm run build`.

No separate Vercel dependency-resolution strategy is permitted.

## Known external/security issue

The current `main` branch has a failing scheduled Gitleaks run because the historical Quality Gate contains a hard-coded Supabase publishable key. The Phase 0 branch removes the literal value from the workflow and references a GitHub Actions secret instead.

The repository secret must exist before the E2E step can pass in CI. This is an infrastructure/security configuration item, not a product feature.

## Local environment note

The most recently reported developer-machine versions were Node `22.23.2`, npm `12.0.2`, and pnpm `12.4.2`.

Node 22.23.2 matches the Node major baseline. npm 12.0.2 does **not** match the repository baseline and must be changed locally to npm 11.19.1 before treating the local environment as conformant. pnpm may remain installed globally for unrelated projects, but it must not be used to install Academia Arcana.

## Change policy

- Dependency changes must be reviewed as toolchain changes.
- Do not upgrade to `latest` automatically.
- Do not bypass peer-dependency validation.
- Do not disable lint/type rules to obtain a green build.
- Do not introduce product functionality in this phase.
