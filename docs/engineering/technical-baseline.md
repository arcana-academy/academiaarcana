# Academia Arcana — Technical Baseline

## Status

Current repository baseline — reconciled 2026-09-27 against `main` at commit `f5f93664d8588373e331c3fbdd6713323fad612f`.

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

The current `main` commit `f5f93664d8588373e331c3fbdd6713323fad612f` includes the Next.js 16.3.6 security baseline, authentication callback hardening, product-domain reconciliation, RPC security hardening, and the eight-character password floor.

The earlier Quality Gate for the Next.js security patch completed successfully, including dependency installation, lint, typecheck, unit tests, accessibility tests, production build, Playwright installation, and E2E tests. The PR #290 authentication hardening added coverage for absolute and external callback destinations and was merged to `main`.

The E2E suite distinguishes anonymous runtime smoke coverage from authenticated Sanctuary coverage that requires dedicated `E2E_EMAIL`/`E2E_PASSWORD` variables. An unexecuted authenticated scenario is not treated as a confirmed application failure.

## GitHub validation

For the current `main` commit `f5f93664d8588373e331c3fbdd6713323fad612f`:

- PR #290 authentication callback hardening is integrated.
- The Next.js security patch to 16.3.6 is integrated.
- Product-domain reconciliation, RPC security hardening, and the eight-character password floor are integrated.
- The current commit reports successful Vercel and pre-commit integration statuses.

The full Quality Gate is established through pull-request checks; deployment state and runtime observability are additionally verified directly in Vercel.

## Vercel

The current Production deployment for commit `f5f93664d8588373e331c3fbdd6713323fad612f` is:

- Deployment: `dpl_cDJBn2To4XUq3CA9Y8diHSpLbdHN`
- State: `READY`
- Target: `production`
- Deployment URL: `https://academiaarcana-qtkm4a6pl-academia-arcana1.vercel.app`
- Aliases include `academiaarcana.vercel.app`

A production runtime-error query for the latest two hours returned no runtime errors. A seven-day query still contains only historical errors from an older deployment related to a missing public Supabase runtime variable; those errors are not present in the current two-hour production observation.

The current Vercel connector does not expose a reliable write operation for environment-variable mutation. No unsupported Vercel-side mutation is being claimed.

## Supabase

The repository contains versioned migrations, the Supabase CLI package, and `supabase/config.toml`, but `supabase/seed.sql` remains absent.

The presence of `supabase/config.toml` and the versioned migrations provides the local configuration and schema, but the absence of `supabase/seed.sql` means a fully populated local database state is not reproducible from the repository alone.

Do not hand-author a speculative `config.toml`. Generate the configuration with the project-pinned Supabase CLI in an isolated checkout, review the generated content, and then commit only the configuration that is actually required.

### Migration history reconciliation

The repository contains the six application migrations that match the current production migration history:

- `20260915181306_remote_schema`
- `20260921174822_revoke_excess_authenticated_table_privileges`
- `20260924003140_rename_notebooks_grimoire_index_reconcile`
- `20260927205154_product_domain_v1`
- `20260927213158_product_rpc_security`
- `20260928003542_atomic_move_workspace_page`

The index reconciliation migration is drift-safe: it accepts either the historical or reconciled index name, rejects an ambiguous state, and does not issue a blind rename. The obsolete `20260917120000_rename_notebooks_grimoire_index` file was removed because production had already been reconciled without that historical migration being recorded.

The production migration history was freshly verified. The workspace page movement RPC is now present as `public.move_workspace_page(uuid,text)`, is `VOLATILE` and `SECURITY INVOKER`, fixes `search_path` to empty, and is executable only by `authenticated` among the application-facing roles.

## Known security state

Current Supabase Security Advisor evidence reports one warning: leaked-password protection is disabled. This feature is plan-gated by Supabase and is intentionally not enabled while the project remains on the current no-cost setup. The Performance Advisor reports unused-index INFO findings; these are not treated as defects because the product tables are currently empty and the indexes are part of the intended query paths.

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
