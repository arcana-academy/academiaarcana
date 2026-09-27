# Academia Arcana — Technical Baseline

## Status

Current repository baseline — reconciled 2026-09-27 against `main` at commit `8b68a9d32cabdab118d389b4d7fc4f9df193feec`.

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

The current `main` checkout was validated locally on Node `v24.21.0` and npm `11.19.1` at commit `8b68a9d32cabdab118d389b4d7fc4f9df193feec`. The same commit was independently validated by the push-triggered Quality Gate recorded below.

- `npm ci` — not re-executed during this reconciliation. Dependency installation remains owned by the Quality Gate, which completed the canonical `npm ci` for this same commit; `package.json` and `package-lock.json` were not modified.
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm test` — 83 test files / 394 tests PASS
- `npm run test:a11y` — 3 test files / 4 tests PASS
- `npm run build` — PASS (10 routes generated)
- `npm run test:e2e` — 10 passed, 1 intentionally skipped because dedicated `E2E_EMAIL`/`E2E_PASSWORD` variables were not configured.

The skipped E2E is the authenticated Sanctuary flow guarded by `test.skip` in `tests/e2e/sanctuary.spec.ts` and is an unexecuted authenticated scenario, not a confirmed application failure. The local untracked validation copies were excluded from the clean checkout and were preserved.

## GitHub validation

For commit `8b68a9d32cabdab118d389b4d7fc4f9df193feec`, the push-triggered Quality Gate run `36327788234` (run #1217) completed successfully, including install, lint, typecheck, unit tests, accessibility tests, production build, Playwright installation, and E2E tests. The same commit also had successful Gitleaks, CodeQL, OpenSSF Scorecard, autofix, Anti-Dark Pattern, and Supabase Preview checks.

The GitHub `Vercel` status for this commit is `failure` with the description `Checks for Deployment have failed`; this is not counted as a successful deployment check. The same `failure` is present on each of the last seven commits examined (`26773f6` through `8b68a9d`), so it is chronic rather than a regression introduced by this commit.

## Vercel

A Production deployment record exists for commit `8b68a9d32cabdab118d389b4d7fc4f9df193feec` and points to `https://academiaarcana-pxvvsyjac-academia-arcana1.vercel.app`. That deployment URL returned HTTP 200 on `/login`, rendering the authentication form, and the root resolved to the login flow. A headless-browser check against the public domain `academiaarcana.vercel.app` reported no console errors, and both `/santuario` and `/workspace` resolved to `/login` for an anonymous session, matching the E2E contract in `tests/e2e/runtime-smoke.spec.ts`. The HTML served by the public domain is identical to the deployment HTML once per-build identifiers are normalized, so the alias-to-SHA association for this commit is established rather than assumed.

The GitHub Vercel status and deployment status remain `failure` with `Checks for Deployment have failed`. The build output and the running application were independently observed to be functional, so the failing element is a check evaluated around the deployment rather than the compiled artifact. The exact failed check and the authoritative `READY` state are still not verifiable: no `VERCEL_TOKEN` is available in this workspace and the Vercel deployments API rejects unauthenticated requests. This remains an open item and is not counted as a passing deployment check.

No domain promotion is implied by this document.

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

## Change policy

- Dependency changes must be reviewed as toolchain changes.
- Do not upgrade to `latest` automatically.
- Do not bypass peer-dependency validation.
- Do not disable lint/type rules to obtain a green build.
- Do not introduce product functionality during infrastructure reconciliation.
- Do not mutate production solely to make documentation or migration history appear green; reconcile from observed state and preserve evidence.
