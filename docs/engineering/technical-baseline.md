# Academia Arcana — Technical Baseline

## Status

Current repository baseline — reconciled 2026-09-27 against `main` at commit `34d5f85eae9ee4e8f60e594493ded35f24dd7b03`.

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
| eslint-config-next | 16.3.5 |
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

## Current validation

The current `main` commit `34d5f85eae9ee4e8f60e594493ded35f24dd7b03` includes the Next.js 16.3.6 security baseline and the subsequent authentication callback hardening from PR #290.

The earlier Quality Gate for the Next.js security patch completed successfully, including dependency installation, lint, typecheck, unit tests, accessibility tests, production build, Playwright installation, and E2E tests. The PR #290 authentication hardening added coverage for absolute and external callback destinations and was merged to `main`.

The E2E suite distinguishes anonymous runtime smoke coverage from authenticated Sanctuary coverage that requires dedicated `E2E_EMAIL`/`E2E_PASSWORD` variables. An unexecuted authenticated scenario is not treated as a confirmed application failure.

## GitHub validation

For the current `main` commit `34d5f85eae9ee4e8f60e594493ded35f24dd7b03`:

- The authentication callback hardening from PR #290 is integrated.
- The Next.js security patch to 16.3.6 is integrated.
- The preceding security/quality validation for those changes completed successfully.

The GitHub Vercel integration status remains an external deployment-check concern and must be validated against the current deployment rather than inferred from build success.

## Vercel

The current Production deployment for commit `34d5f85eae9ee4e8f60e594493ded35f24dd7b03` is:

- Deployment: `dpl_HJYWcuQ49iPjpd7YeEMyXv8JdDvp`
- State: `READY`
- Target: `production`
- Deployment URL: `https://academiaarcana-50vewo5b4-academia-arcana1.vercel.app`

The current Production deployment is reported as `READY`. Runtime validation of the newer Next.js deployment immediately before this commit also showed no error/fatal entries in the most recent one-hour observation.

A direct fetch of the project public alias previously returned an older deployment identifier rather than the then-current Production deployment. This alias discrepancy remains a Vercel-side item to verify and must not be hidden by treating the deployment build itself as sufficient evidence.

The current Vercel connector does not expose a reliable write operation for alias promotion or project environment-variable mutation. No unsupported Vercel-side mutation is being claimed.

## Supabase

The repository contains versioned migrations, the Supabase CLI package, and `supabase/config.toml`, but `supabase/seed.sql` remains absent.

The presence of `supabase/config.toml` and the versioned migrations provides the local configuration and schema, but the absence of `supabase/seed.sql` means a fully populated local database state is not reproducible from the repository alone.

Do not hand-author a speculative `config.toml`. Generate the configuration with the project-pinned Supabase CLI in an isolated checkout, review the generated content, and then commit only the configuration that is actually required.

### Migration history reconciliation

The repository contains five application migrations:

- `20260915181306_remote_schema`
- `20260917120000_rename_notebooks_grimoire_index`
- `20260921174822_revoke_excess_authenticated_table_privileges`
- `20260924003140_rename_notebooks_grimoire_index_reconcile`
- `20260924210000_atomic_move_workspace_page`

The reconciliation migration is drift-safe: it accepts either the historical or reconciled index name, rejects an ambiguous state, and does not issue a blind rename.

A prior audit recorded that the live database had `idx_notebooks_grimoire_id` while the remote migration history lacked the rename step. The remote migration list, live index query, and current advisors were not revalidated in this workspace because the Supabase CLI has no linked project or database credential. Do not mutate production without a fresh, authorized observation.

## Known security state

The last recorded Supabase Security Advisor evidence reported one warning for leaked-password protection being disabled and seven low-usage indexes. The tables were reported empty, so those indexes must not be removed solely from that observation. Current advisor output was not revalidated because the remote project is not linked in this workspace.

## Observability configuration

Honeybadger configuration consumes public environment variables for the browser/server integration. These are optional from the build's perspective because the configuration handles missing values without failing the build. They should remain environment-managed and must not be replaced with hard-coded secrets.

Historical Production runtime data recorded missing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` errors on earlier deployments. Recent runtime observations for the current deployments did not show new error/fatal entries, but the Vercel environment-variable configuration itself is not directly verifiable through the available connector surface.

## Change policy

- Dependency changes must be reviewed as toolchain changes.
- Do not upgrade to `latest` automatically.
- Do not bypass peer-dependency validation.
- Do not disable lint/type rules to obtain a green build.
- Do not introduce product functionality during infrastructure reconciliation.
- Do not mutate production solely to make documentation or migration history appear green; reconcile from observed state and preserve evidence.
