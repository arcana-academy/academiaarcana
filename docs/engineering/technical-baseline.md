# Academia Arcana — Technical Baseline

## Status

Current repository baseline — reconciled 2026-09-24 against `main` at commit `810a1ce861391f01cf94c034789fd25a81775b1c`.

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

The current `main` checkout was reconciled against a clean validation checkout at commit `810a1ce861391f01cf94c034789fd25a81775b1c`.

- `npm ci` — PASS in the original workspace (exit code 0; `package-lock.json` unchanged). In the clean validation checkout, the first full invocation exceeded the orchestration timeout after materializing dependencies; `npm ls --depth=0` and `npm ci --dry-run` passed, and GitHub CI independently completed the canonical install for this SHA.
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm test` — 82 test files / 370 tests PASS
- `npm run test:a11y` — 3 test files / 4 tests PASS
- `npm run build` — PASS
- `npm exec -- playwright install --with-deps chromium` — PASS
- `npm run test:e2e` — 2 PASS, 1 intentionally skipped because dedicated `E2E_EMAIL`/`E2E_PASSWORD` variables were not configured.

The skipped E2E is an unexecuted authenticated scenario, not a confirmed application failure. The local untracked validation copies were excluded from the clean checkout and were preserved.

## GitHub validation

For commit `810a1ce861391f01cf94c034789fd25a81775b1c`, the push-triggered Quality Gate run `35944336443` completed successfully, including install, lint, typecheck, unit tests, accessibility tests, production build, Playwright installation, and E2E tests. The same commit also had successful Gitleaks, CodeQL, OpenSSF Scorecard, autofix, and Supabase Preview checks.

The GitHub `Vercel` status for this commit is currently `failure` with the description `Checks for Deployment have failed`; this is not counted as a successful deployment check.

## Vercel

A Production deployment record exists for commit `810a1ce861391f01cf94c034789fd25a81775b1c` and points to `https://academiaarcana-42ppsfy51-academia-arcana1.vercel.app`. The public `/login` endpoint returned HTTP 200, the root redirected to `/login`, and a browser check found no console errors or missing-Supabase-variable marker.

However, the GitHub Vercel status and deployment status are both `failure` with `Checks for Deployment have failed`. The Vercel dashboard/API requires authentication, so the exact failed check and the authoritative `READY` state were not independently verifiable. The public domain `academiaarcana.vercel.app` also returned HTTP 200, but its alias-to-SHA association was not proven.

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
