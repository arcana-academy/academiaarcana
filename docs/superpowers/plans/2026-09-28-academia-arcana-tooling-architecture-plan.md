# Academia Arcana Tooling Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the approved tooling architecture into an incremental production foundation for Academia Arcana, with a stable core, isolated integrations, strong UX foundations, and evidence-based quality gates.

**Architecture:** Keep product domains independent from provider SDKs through application-level integration contracts. Build the user-facing shell and core learning flows first; add optional integrations behind adapters; validate each layer through automated tests, browser verification, accessibility checks, and deployment checks.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind/CSS, Lucide React, Supabase, Vitest, Testing Library, Playwright, GitHub Actions, Vercel, Honeybadger.

**Spec:** `docs/superpowers/specs/2026-09-28-academia-arcana-tooling-architecture-design.md`

## Global Constraints

- Core functionality must operate without optional third-party integrations.
- External providers must be isolated behind application-level contracts.
- WCAG 2.2 AA is the minimum accessibility target.
- Supabase RLS and least privilege remain authoritative for application data.
- Secrets must not enter client bundles or source control.
- AI must not invent application state.
- Every UI change requires browser/visual verification.
- Merge readiness requires applicable lint, typecheck, unit/component, accessibility, build, and E2E checks.
- Repository runtime is Node.js 24 with npm 11.19.1.

## Review Focus

- An unavailable external integration must not break core navigation or rendering; test adapter failure and fallback states.
- An unauthenticated user must not receive authenticated application data; test server-side identity boundaries.
- Keyboard and reduced-motion users must receive equivalent core flows; test focus order and reduced-motion behavior.
- Missing optional environment variables must not make unrelated routes unusable; test configuration isolation.
- AI/provider failures must degrade to deterministic UI states without fabricating data; test explicit error/empty states.

### Task 1: Integration boundary foundation

**Files:**
- Create: `src/application/integrations/contracts.ts`
- Create: `src/application/integrations/registry.ts`
- Create: `src/application/integrations/types.ts`
- Test: `src/application/integrations/contracts.test.ts`
- Test: `src/application/integrations/registry.test.ts`

**Interfaces:**
- Produces `IntegrationCapability`, `IntegrationAdapter`, `IntegrationRegistry`, and deterministic availability/failure contracts for later provider adapters.
- Core domains consume registry interfaces rather than provider-specific modules.

- [ ] Step 1: Write failing tests for provider-independent capability registration, lookup, unavailable-provider fallback, and duplicate capability rejection.
- [ ] Step 2: Run `npm test -- src/application/integrations/contracts.test.ts src/application/integrations/registry.test.ts`; expected initial failures identify missing contracts.
- [ ] Step 3: Implement the minimal typed contracts and registry.
- [ ] Step 4: Re-run the focused tests and confirm PASS.
- [ ] Step 5: Run `npm run typecheck` and confirm no new type errors.
- [ ] Step 6: Commit `feat: add integration capability boundaries`.

### Task 2: Application shell and design-system foundation

**Files:**
- Inspect/modify: `src/app/layout.tsx`
- Inspect/modify: `src/app/globals.css`
- Create or split focused files under `src/components/layout/` and `src/components/ui/` as required by the existing patterns.
- Test: corresponding component and accessibility tests.

**Interfaces:**
- Shell consumes authenticated identity state and renders navigation/notifications/theme primitives.
- UI primitives expose stable accessible APIs to feature domains.

- [ ] Step 1: Add failing tests for semantic landmarks, keyboard navigation, focus visibility, reduced motion, and responsive shell behavior.
- [ ] Step 2: Run the focused component/accessibility tests and verify failure.
- [ ] Step 3: Implement the shell using existing styling conventions and accessible primitives; avoid coupling it to optional integrations.
- [ ] Step 4: Run focused tests and confirm PASS.
- [ ] Step 5: Start the development server and use browser verification for desktop/mobile and keyboard flows; resolve console/runtime issues.
- [ ] Step 6: Commit `feat: establish accessible application shell`.

### Task 3: Core Sanctuary experience

**Files:**
- Inspect existing `src/app/santuario/` implementation.
- Modify/create focused Sanctuary feature components within the existing domain structure.
- Test: Sanctuary unit/component/accessibility tests and E2E coverage.

**Interfaces:**
- Sanctuary consumes core identity, context, learning/planning state, and optional integration summaries only through internal contracts.
- Sanctuary must render a deterministic empty/loading/error state when optional providers are unavailable.

- [ ] Step 1: Write failing tests for authenticated Sanctuary rendering, empty state, next-action state, and optional-integration failure.
- [ ] Step 2: Run focused tests and verify failure.
- [ ] Step 3: Implement the core Sanctuary flow without direct provider SDK dependencies.
- [ ] Step 4: Run focused tests and confirm PASS.
- [ ] Step 5: Verify the complete flow in Playwright at desktop and mobile breakpoints.
- [ ] Step 6: Commit `feat: build Sanctuary core experience`.

### Task 4: Grimoire data/application boundary

**Files:**
- Inspect existing Grimoire/application/domain modules.
- Modify/create only the focused application/data files required for the Grimoire flow.
- Supabase migrations only if an identified schema gap exists.
- Test: repository/service/component tests plus RLS-sensitive integration coverage where available.

**Interfaces:**
- Grimoire application services expose typed operations for grimoires, notebooks, chapters, and pages.
- Persistence remains behind Supabase data access functions; UI never performs unrestricted database access.

- [ ] Step 1: Write failing tests for ownership-aware read/write behavior, ordering constraints, and empty collections.
- [ ] Step 2: Run focused tests and verify failure.
- [ ] Step 3: Implement or reconcile application services with the existing Supabase schema and migrations.
- [ ] Step 4: Run tests and typecheck.
- [ ] Step 5: Run the relevant Supabase verification workflow and confirm RLS/ownership invariants remain intact.
- [ ] Step 6: Commit `feat: stabilize Grimoire application boundary`.

### Task 5: Optional integration adapters

**Files:**
- Create provider adapter modules under `src/application/integrations/providers/` only for integrations with an approved concrete product flow.
- Create tests alongside each adapter.

**Interfaces:**
- Each adapter implements the common integration contract from Task 1.
- Provider-specific credentials and SDK calls remain inside the adapter.

- [ ] Step 1: Select the first integrations that solve a concrete core workflow rather than adding integrations by catalog size.
- [ ] Step 2: Write failing contract tests for success, timeout, unauthorized, unavailable, malformed-response, and disabled-configuration states.
- [ ] Step 3: Implement adapters with graceful fallback and explicit telemetry classification.
- [ ] Step 4: Run adapter contract tests.
- [ ] Step 5: Verify that disabling an adapter leaves core routes functional.
- [ ] Step 6: Commit `feat: add isolated learning integration adapters`.

### Task 6: AI/Mestre Arcano boundary

**Files:**
- Create or adapt the intelligence/application boundary according to existing architecture.
- Create tests for AI request validation, deterministic fallbacks, and persistence identifiers where generation persistence is introduced.

**Interfaces:**
- AI services accept bounded application context and return typed results.
- AI cannot mutate authoritative application state without an explicit application command.

- [ ] Step 1: Write failing tests for bounded context, invalid input, provider failure, and no-fabrication behavior.
- [ ] Step 2: Run focused tests and verify failure.
- [ ] Step 3: Implement the AI service boundary using Vercel AI SDK/Gateway only behind application interfaces.
- [ ] Step 4: Run tests and typecheck.
- [ ] Step 5: Browser-test the AI surface including loading, error, empty, and reduced-motion states.
- [ ] Step 6: Commit `feat: establish Mestre Arcano service boundary`.

### Task 7: Observability and security verification

**Files:**
- Inspect/modify `next.config.ts`.
- Inspect/modify Vercel/Honeybadger configuration only where required.
- Add tests for safe headers/configuration and error handling.

- [ ] Step 1: Write failing checks for required security headers, redacted error telemetry, and missing optional observability configuration.
- [ ] Step 2: Run focused tests and verify failure.
- [ ] Step 3: Implement only the required safe configuration.
- [ ] Step 4: Run tests and inspect production build output for accidental secret exposure.
- [ ] Step 5: Verify Vercel observability/error handling in preview.
- [ ] Step 6: Commit `chore: harden observability and security boundaries`.

### Task 8: End-to-end quality gate and visual QA

**Files:**
- Inspect/modify `.github/workflows/quality.yml`.
- Inspect/modify Playwright configuration/specs only where needed.
- Add regression tests for the core journey.

- [ ] Step 1: Add/adjust E2E coverage for landing → authentication → Sanctuary → Grimoire.
- [ ] Step 2: Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:a11y`, `npm run build`, and `npm run test:e2e`.
- [ ] Step 3: Start the production-like application and perform browser verification at desktop/mobile widths.
- [ ] Step 4: Resolve every failure before claiming readiness.
- [ ] Step 5: Verify the GitHub Actions Quality Gate on the resulting commit/PR.
- [ ] Step 6: Commit `test: complete core quality gate coverage`.

### Task 9: Preview and production readiness

**Files:**
- Modify deployment configuration only when verification identifies a concrete issue.
- No production secret values are committed.

- [ ] Step 1: Verify required Vercel environment variables exist for the intended environments.
- [ ] Step 2: Deploy a preview and verify browser flows against the deployed build.
- [ ] Step 3: Verify Supabase production configuration, migrations, RLS, grants, and relevant auth settings.
- [ ] Step 4: Verify observability and error reporting without exposing sensitive data.
- [ ] Step 5: Promote only after all required checks are green.
- [ ] Step 6: Commit any necessary deployment-only fixes separately from product code.

## Execution order

Tasks 1–4 establish the core and are prerequisites for integration work. Task 5 depends on Task 1. Task 6 depends on the application shell and integration boundary. Task 7 can proceed after the runtime surfaces exist. Task 8 is the release gate for Tasks 1–7. Task 9 is deployment verification and must not substitute for local/CI quality checks.

## Definition of done

- Core routes work with all optional integrations disabled.
- Integration providers are isolated behind stable application contracts.
- Core Sanctuary and Grimoire flows are functional and accessible.
- AI behavior is bounded and non-authoritative.
- Supabase ownership/RLS invariants remain intact.
- Browser verification is clean at desktop and mobile breakpoints.
- Quality Gate passes.
- Preview deployment passes the same core journey.
- Production promotion is evidence-based, not inferred from static audits.
