# Render Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the active Vercel/GitHub Pages delivery assumptions from Academia Arcana and establish a consistent GitHub + GitHub Actions + Supabase + Render delivery contract.

**Architecture:** GitHub remains the source of code and pull-request history. GitHub Actions owns deterministic validation (install, lint, typecheck, unit/accessibility, build and E2E), while Render owns the Next.js Web Service runtime and Supabase remains the only application database/auth provider. Historical Vercel evidence remains historical, but no active runtime, CI or canonical architecture document depends on Vercel.

**Tech Stack:** Next.js 16.3.6, React 19.3.0, TypeScript 6.0.3, npm 11.19.1, Node 24.x, Vitest 4.1.11, Playwright 1.63.0, GitHub Actions, Supabase, Render Web Service.

**Spec:** User-approved delivery architecture: GitHub + GitHub Actions + Supabase + Render, plus `docs/architecture/AA-ARCHITECTURE-1.0.md` and current repository runtime/configuration contracts.

## Global Constraints

- Production runtime: Render Web Service `academiaarcana`.
- Source repository: `arcana-academy/academiaarcana`.
- Node.js: `24.x`.
- npm: `11.19.1`.
- Install with `npm ci`; do not use `--force` or `--legacy-peer-deps`.
- Browser-facing Supabase configuration uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Never commit real Supabase, Honeybadger, OAuth, AI provider or other secrets.
- Historical Vercel reports remain historical evidence and are not rewritten as if they were Render runs.
- No GitHub Pages deployment may remain active.
- Render must remain a single web service; do not create a duplicate database or worker for this migration.
- Render deployment configuration must not introduce a second package manager or change application functionality.

## Review Focus

- Missing Supabase runtime variables must fail fast in both CI and Render builds; test the exact error path.
- Residual Vercel environment variables/configuration must not affect application behavior; test the environment resolver and Honeybadger metadata.
- A competing GitHub Pages workflow must not publish or attempt to publish the application; validate workflow inventory after removal.
- Production smoke checks must target the actual Render service URL and the same application contract; validate the workflow text and endpoint paths.
- Secrets must stay out of GitHub files and Render IaC; configuration must use environment-managed values and `sync: false` where applicable.

---

### Task 1: Runtime environment contract migration

**Files:**
- Modify: `scripts/verify-public-runtime-config.mjs`
- Test: `scripts/verify-public-runtime-config.test.mjs`
- Modify: `src/core/config/env.test.ts`

**Interfaces:**
- Produces: `verifyPublicRuntimeConfig(environment)` reports `NODE_ENV` rather than provider-specific deployment metadata.
- Consumes: existing public Supabase variables only.

- [x] **Step 1: Write failing tests** asserting that `verifyPublicRuntimeConfig` uses `NODE_ENV` and no longer needs `VERCEL_ENV`, and rename the provider-specific test descriptions in `src/core/config/env.test.ts`.
- [x] **Step 2: Run the focused tests on the branch and confirm the new assertions fail because the implementation still reads `VERCEL_ENV`.**
- [x] **Step 3: Change the implementation to return `environment: environment.NODE_ENV ?? "unknown"` and remove Vercel-specific terminology from the tests.
- [x] **Step 4: Run the focused tests again and confirm they pass.**
- [x] **Step 5: Commit:** `fix(config): remove Vercel runtime dependency`

### Task 2: Observability runtime migration

**Files:**
- Modify: `honeybadger.browser.config.js`
- Modify: `honeybadger.edge.config.js`
- Modify: `honeybadger.server.config.js`
- Test: `honeybadger.config.test.ts`
- Test: `honeybadger.config.test.js`

**Interfaces:**
- Browser/edge/server configs use `NODE_ENV` for environment classification.
- Server revision may use `NEXT_PUBLIC_HONEYBADGER_REVISION` and fall back to Render's `RENDER_GIT_COMMIT`.

- [x] **Step 1: Write failing tests asserting Vercel variables are irrelevant and NODE_ENV/Render commit metadata are used.**
- [x] **Step 2: Run the focused Honeybadger tests and confirm failure against current Vercel-based fallback logic.**
- [x] **Step 3: Remove `NEXT_PUBLIC_VERCEL_ENV`/`VERCEL_ENV` reads from all Honeybadger runtime files and use the generic runtime contract.
- [x] **Step 4: Run the focused Honeybadger tests and confirm pass.**
- [x] **Step 5: Commit:** `refactor(observability): make Honeybadger provider-neutral`

### Task 3: Delivery workflow migration

**Files:**
- Modify: `.github/workflows/production-smoke.yml`
- Delete: `.github/workflows/nextjs.yml`
- Modify: `.github/workflows/quality.yml` only if needed to remove provider-specific assumptions.
- Create: `render.yaml`
- Test/validation: workflow syntax and static contract checks through repository CI.

**Interfaces:**
- Production smoke target: `https://academiaarcana.onrender.com`.
- Render desired web service: Node 24, `npm ci && npm run build`, `npm start`, root health check, main branch.
- Supabase publishable values remain external secrets/configuration and are not hard-coded.

- [x] **Step 1: Add a repository-level configuration contract test/check that rejects Vercel URLs and GitHub Pages deployment workflow paths from active delivery files.**
- [x] **Step 2: Run the new check against current main-derived branch and confirm it fails because active Vercel/GitHub Pages references exist.**
- [x] **Step 3: Replace production smoke URL/labels with the Render service URL and keep its existing application contract assertions.
- [x] **Step 4: Delete `.github/workflows/nextjs.yml` because it is an unrelated GitHub Pages deployment path using Node 20.
- [x] **Step 5: Add `render.yaml` describing the single `academiaarcana` web service, with `npm ci && npm run build`, `npm start`, Node runtime 24, main branch, and environment-managed Supabase variables.
- [ ] **Step 6: Run the configuration contract check and confirm it passes.
- [ ] **Step 7: Commit:** `chore(deploy): migrate delivery contract to Render`

### Task 4: Canonical documentation/tool map reconciliation

**Files:**
- Modify: `docs/architecture/AA-ARCHITECTURE-1.0.md`
- Modify: `docs/integrations/final-integration-state.md`
- Modify: `docs/engineering/project-integrations.md`
- Modify: `docs/engineering/technical-baseline.md`
- Modify: `src/infrastructure/integrations/arcana-tool-map.ts`

**Interfaces:**
- Canonical operational docs describe Render as production runtime.
- Historical validation docs retain Vercel references only where they document historical evidence.

- [x] **Step 1: Add/update tests for the tool map and canonical delivery text where existing test infrastructure supports it.
- [x] **Step 2: Run the focused documentation/tool-map checks and confirm they fail against current Vercel claims.
- [x] **Step 3: Replace active Vercel delivery claims with Render while preserving historical evidence sections as historical.
- [x] **Step 4: Run the focused checks and confirm they pass.
- [x] **Step 5: Commit:** `docs(infra): reconcile canonical delivery documentation`

### Task 5: Final repository verification

**Files:**
- No new production files beyond Tasks 1–4.

- [x] **Step 1: Run `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:a11y`, `npm run build`, and `npm run test:e2e` through GitHub Actions or an equivalent clean environment because the connected environment cannot resolve GitHub for a local clone.
- [x] **Step 2: Verify Supabase project health and current migrations/RLS with the Supabase MCP after code changes.
- [x] **Step 3: Verify Render service configuration and the newest deployment status/logs.
- [x] **Step 4: Create a pull request from `chore/migrate-vercel-to-render` to `main`; do not merge automatically.


### Task 5.5: Supabase migration history reconciliation

**Reason for addition:** The live Supabase project currently reports 16 applied migration versions while the repository contains 14 migration files, with several version/name pairs not matching one-to-one. This is an observed integration drift and must be reconciled before claiming migration integrity.

- [x] **Step 1:** Compare the live migration list with repository migration filenames and inspect the SQL of the mismatched migration families.
- [x] **Step 2:** Verify the resulting live schema, RLS, grants, functions and storage objects using read-only Supabase checks.
- [x] **Step 3:** Do not delete, rewrite or repair remote migration history merely to match repository filenames. If the schema is already correct, document the historical divergence and preserve the live migration ledger.
- [x] **Step 4:** If a safe forward-only reconciliation migration is required, add it as a new versioned migration and validate it locally before applying.
- [x] **Step 5:** Update the technical baseline with the observed repository/live distinction.

## Current execution status — 2026-09-30

- Repository migration work through Task 4 is implemented on `chore/migrate-vercel-to-render` and reviewed by GitHub Actions.
- Latest Quality Gate and Database Tests are green on the branch HEAD verified during this migration.
- Render service reconciliation is still pending in the live dashboard because the service was created with legacy build/auto-deploy settings and currently holds placeholder Supabase environment values.
- Vercel Git integration has been disconnected from the `academiaarcana` project; the Vercel project itself was not deleted.
- Netlify still has an external GitHub check path associated with this repository, but its dashboard cannot be modified until an authenticated Netlify session is available. This must be removed before enabling Render `checksPass`, otherwise that failing check can block a Render auto-deploy.
- Supabase production is healthy; its live migration ledger contains 16 applied versions while the repository has 14 migration files. This mismatch is documented as historical/live ledger drift and has not been force-repaired.
