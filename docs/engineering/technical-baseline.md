# Academia Arcana — Technical Baseline

## Status

Current repository baseline — reconciled 2026-09-23.

This document defines the currently supported development and build baseline for the repository. It does not authorize product-feature work.

## Runtime

- Node.js: `24.x`
- Local pin file: `.nvmrc` = `24`
- CI: Node.js `24`
- The repository standardizes on Node 24 because `package.json#engines`, `package.json#devEngines`, `.nvmrc`, CI, and the current local validation all agree on that major version.
- The current local workstation validation reported Node `v24.21.0`.

## Package Manager

- Official package manager: **npm**
- Required npm version: `11.19.1`
- `package.json#packageManager`: `npm@11.19.1`
- `package.json#engines`: Node `24.x`, npm `11.19.1`
- `package.json#devEngines`: Node `24.x` with failure on mismatch; npm `11.19.1` with warning during bootstrap.
- Do not use pnpm as the repository package manager.

## Lockfile

- Official lockfile: `package-lock.json`
- Lockfile format: npm lockfile v3
- No `pnpm-lock.yaml` is present on `main`.
- A second package-manager lockfile must not be introduced.

## Core toolchain

| Technology | Baseline |
|---|---:|
| Next.js | 16.3.6 |
| React | 19.3.0 |
| React DOM | 19.3.0 |
| TypeScript | 6.0.3 |
| ESLint | 9.39.5 |
| eslint-config-next | 16.3.6 |
| typescript-eslint | 8.70.0 (resolved transitively by eslint-config-next) |
| Vitest | 4.1.11 |
| Testing Library React | 16.3.3 |
| Testing Library DOM | 10.4.2 |
| Playwright | 1.63.0 |
| Vite | 7.3.6 |
| @vitejs/plugin-react | 5.x on current main |

## TypeScript policy

TypeScript 7 is **not** part of this baseline.

The repository uses the ordinary `typescript@6.0.3` package directly. The current dependency chain is kept below the `typescript-eslint` support ceiling rather than introducing a parallel TypeScript 7 installation.

No TypeScript 6/7 side-by-side installation is permitted for this phase.

## CI rules

The Quality Gate must:

1. run on Node 24;
2. install npm 11.19.1 explicitly;
3. use `npm ci`;
4. avoid `--force`;
5. avoid `--legacy-peer-deps`;
6. use the Playwright version declared in `package.json`;
7. run lint;
8. run typecheck;
9. run unit tests;
10. run accessibility tests;
11. run the production build with the same required public Supabase placeholders used by the E2E environment;
12. run the E2E suite.

The application lint command intentionally excludes the local, Git-ignored `welcome-to-docker/**` subtree so external legacy JavaScript cannot contaminate the project Quality Gate.

## Current local validation

The current local checkout at commit `b01c7b2` was validated with:

- `npm ci` — PASS
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm test` — 370/370 PASS
- `npm run test:a11y` — 4/4 PASS
- `npm run build` — PASS
- `npm run test:e2e` — 2 PASS, 1 intentionally skipped because dedicated `E2E_EMAIL`/`E2E_PASSWORD` variables were not configured.

The skipped E2E is an unexecuted authenticated scenario, not a confirmed application failure.

## GitHub validation

For commit `b01c7b2`, the push-triggered workflows observed at the time of this reconciliation were successful:

- Academia Arcana Quality Gate
- Gitleaks
- CodeQL
- OpenSSF Scorecard
- autofix.ci

## Vercel

A production-target deployment exists for commit `b01c7b2` and is `READY`.

The deployment is:

- deployment: `dpl_5N96fZ4sqhFMtb5GeDb43SCptWTD`
- target: `production`
- commit: `b01c7b20f183e384e40f058f5a125040c155a83d`

The public domain `academiaarcana.vercel.app` is still associated with the earlier deployment for commit `d06941d`. Therefore GitHub `main`, the latest READY deployment, and the public production domain are not yet fully reconciled.

No domain promotion is implied by this document.

## Supabase

The repository contains versioned migrations, the Supabase CLI package, and `supabase/config.toml`, but `supabase/seed.sql` remains absent.

The presence of `supabase/config.toml` and the versioned migrations provides the local configuration and schema, but the absence of `supabase/seed.sql` means a fully populated local database state is not reproducible from the repository alone.

Do not hand-author a speculative `config.toml`. Generate the configuration with the project-pinned Supabase CLI in an isolated checkout, review the generated content, and then commit only the configuration that is actually required.

### Migration history reconciliation

The repository contains three application migrations:

- `20260915181306_remote_schema`
- `20260917120000_rename_notebooks_grimoire_index`
- `20260921174822_revoke_excess_authenticated_table_privileges`

The linked production Supabase project currently reports only:

- `20260915181306_remote_schema`
- `20260921174822_revoke_excess_authenticated_table_privileges`

At the same time, the live database has the renamed index `idx_notebooks_grimoire_id`, which indicates that the effect of the missing migration is present even though the migration history does not contain it.

This is a **migration-history drift** finding. It remains pending reconciliation and must not be repaired by blindly changing production.

## Known security state

The current Supabase Security Advisor reports one warning for leaked-password protection being disabled. Seven unused indexes are also reported by the Performance Advisor; the tables are currently empty, so those indexes must not be removed solely from that observation.

## Observability configuration

Honeybadger configuration consumes public environment variables for the browser/server integration. These are optional from the build's perspective because the configuration handles missing values without failing the build. They should remain environment-managed and must not be replaced with hard-coded secrets.

## Change policy

- Dependency changes must be reviewed as toolchain changes.
- Do not upgrade to `latest` automatically.
- Do not bypass peer-dependency validation.
- Do not disable lint/type rules to obtain a green build.
- Do not introduce product functionality during infrastructure reconciliation.
- Do not mutate production solely to make documentation or migration history appear green; reconcile from observed state and preserve evidence.
