# Academia Arcana — Technical Baseline

## Status

Repository baseline — reconciled on 2026-09-28 against the validated code snapshot at commit `c9fb8f42ddcdbf15900bbd7b1eb7e1e21a21829d`. `main` has since advanced; a snapshot is not silently relabeled as current.

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
| TypeScript | 5.9.3 |
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

The repository uses the ordinary `typescript@5.9.3` package directly. The current dependency chain is kept below the `typescript-eslint` support ceiling rather than introducing a parallel TypeScript 7 installation.

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

The validated code snapshot at commit `c9fb8f42ddcdbf15900bbd7b1eb7e1e21a21829d` includes the Next.js 16.3.6 security baseline, authentication callback hardening, product-domain reconciliation, RPC security hardening, the eight-character password floor, and the least-privilege hardening of the product reward RPC.

The earlier Quality Gate for the Next.js security patch completed successfully, including dependency installation, lint, typecheck, unit tests, accessibility tests, production build, Playwright installation, and E2E tests. The PR #290 authentication hardening added coverage for absolute and external callback destinations and was merged to `main`.

The E2E suite distinguishes anonymous runtime smoke coverage from authenticated Sanctuary coverage that requires dedicated `E2E_EMAIL`/`E2E_PASSWORD` variables. An unexecuted authenticated scenario is not treated as a confirmed application failure.

## GitHub validation

For the validated baseline snapshot (`c9fb8f42ddcdbf15900bbd7b1eb7e1e21a21829d`):

- PR #290 authentication callback hardening is integrated.
- The Next.js security patch to 16.3.6 is integrated.
- Product-domain reconciliation, RPC security hardening, and the eight-character password floor are integrated.
- PR #309 removed unnecessary `service_role` execution from the public reward RPC and added a regression assertion.
- PR #309 completed the Database Tests and Quality Gate successfully, along with CodeQL, Gitleaks, Dependency Review, AccessLint, qlty, CodeRabbit, CommitCheck, pre-commit, and Render.

The full Quality Gate is established through pull-request checks; deployment state and runtime observability are verified directly in Render for each resulting production deployment.

## Render

The validated production snapshot associated with this baseline is deployment `dpl_F8G5MrgYSa6t3uwbnJ4MWFGD8nGp`, generated from commit `c9fb8f42ddcdbf15900bbd7b1eb7e1e21a21829d`.

The deployment was `READY`, and the repository's Production Smoke workflow completed successfully for the same commit.

The production snapshot verification returned no error, warning, or fatal runtime logs in the latest 1-hour observation. A 24-hour query timed out and is not treated as evidence of a clean 24-hour window. The Production Smoke workflow also verifies the homepage, public authentication/integration routes, and the integration-status contract.

The Render connector used for this audit does not expose a reliable environment-variable mutation operation. No unsupported Render-side environment mutation is claimed.

## Supabase

The repository contains versioned migrations, the Supabase CLI package, and `supabase/config.toml`, but `supabase/seed.sql` remains absent.

The presence of `supabase/config.toml` and the versioned migrations provides the local configuration and schema, but the absence of `supabase/seed.sql` means a fully populated local database state is not reproducible from the repository alone.

Do not hand-author a speculative `config.toml`. Generate the configuration with the project-pinned Supabase CLI in an isolated checkout, review the generated content, and then commit only the configuration that is actually required.

### Migration history reconciliation

The repository contains the seven application migrations represented by the current production migration history:

- 20260915181306_remote_schema
- 20260921174822_revoke_excess_authenticated_table_privileges
- 20260924003140_rename_notebooks_grimoire_index_reconcile
- 20260927205154_product_domain_v1
- 20260927213158_product_rpc_security
- 20260928003542_atomic_move_workspace_page
- 20260928005837_20260928005514_tighten_product_rpc_execute_grants
- 20260928190328_grimoire_covers_storage
- 20260929124554_product_social_focus
- 20260929142350_harden_friend_connection_updates
- 20260929155423_outlook_calendar_credentials
- 20260929172005_create_external_document_sources
- 20260929201711_feedback_hub
- 20260929201757_feedback_hub_permissions
- 20260929202937_feedback_hub_require_authenticated_owner
- 20260929220739_revoke_excess_external_document_source_privileges

The index reconciliation migration is drift-safe: it accepts either the historical or reconciled index name, rejects an ambiguous state, and does not issue a blind rename. The obsolete `20260917120000_rename_notebooks_grimoire_index` file was removed because production had already been reconciled without that historical migration being recorded.

The production migration history was freshly verified. Supabase registered the least-privilege grant migration with version `20260928005837` and migration name `20260928005514_tighten_product_rpc_execute_grants`; the repository filename matches that recorded history. The public reward wrapper is `SECURITY INVOKER`, has an empty `search_path`, and is executable by `authenticated` but not by `anon` or `service_role`. The workspace page movement RPC is also `VOLATILE`, `SECURITY INVOKER`, uses an empty `search_path`, and is executable only by `authenticated` among the application-facing roles.

## Known security state

Current Supabase Security Advisor evidence reports one warning: leaked-password protection is disabled. This feature is plan-gated by Supabase and is intentionally not enabled while the project remains on the current no-cost setup. The Performance Advisor reports unused-index INFO findings; these are not treated as defects because the product tables are currently empty and the indexes are part of the intended query paths.

## Observability configuration

Honeybadger configuration consumes public environment variables for the browser/server integration. These are optional from the build's perspective because the configuration handles missing values without failing the build. They should remain environment-managed and must not be replaced with hard-coded secrets.

Historical Production runtime data recorded missing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` errors on earlier deployments. Recent runtime observations for the current deployments did not show new error/fatal entries, but the Render environment-variable configuration itself is not directly verifiable through the available connector surface.

## Change policy
- The repository pins TypeScript `5.9.3` because the current DeepSource JavaScript analyzer supports TypeScript through 5.9; keeping the supported analyzer/runtime intersection avoids an external static-analysis failure without weakening local type checking.

- Dependency changes must be reviewed as toolchain changes.
- Do not upgrade to `latest` automatically.
- Do not bypass peer-dependency validation.
- Do not disable lint/type rules to obtain a green build.
- Do not introduce product functionality during infrastructure reconciliation.
- Do not mutate production solely to make documentation or migration history appear green; reconcile from observed state and preserve evidence.


## Adaptive recommendations

The adaptive domain now exposes bounded, evidence-based recommendations to the Sanctuary application layer. Recommendations consume authorized learning, planning, and gamification signals and remain a projection; they do not become a parallel source of persisted truth.
