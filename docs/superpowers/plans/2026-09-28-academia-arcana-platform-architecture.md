# Academia Arcana Platform Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the approved Academia Arcana architecture into a production-ready modular web platform whose Core remains independent of optional external integrations.

**Architecture:** Preserve the existing modular monolith and reconcile the existing design-system, application, domain, and infrastructure slices instead of creating parallel implementations. Build the product in six independently verifiable slices: foundation/shell, Core experiences, integration boundary, intelligence, production hardening, and final browser/deployment verification. External providers are always reached through server-side adapters and never become direct dependencies of Core domain logic.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 6, Tailwind/CSS tokens, Lucide React, Supabase/PostgreSQL/RLS/Auth, Vitest + Testing Library, Playwright, GitHub Actions, Vercel, Honeybadger, provider-specific adapters.

**Spec:** `docs/superpowers/specs/2026-09-28-academia-arcana-platform-architecture-design.md`

## Global Constraints

- Preserve the modular monolith; do not introduce microservices.
- Core domains must not import vendor SDKs directly.
- Vercel is the primary deployment/runtime platform.
- Supabase/PostgreSQL is the authoritative application data store and authorization boundary.
- Browser code may use only public client configuration; secrets remain server-side.
- AI must not invent application state.
- Accessibility target is WCAG 2.2 AA.
- The interface uses Dark Fantasy Arcane as the dominant identity with Arcane Academic as a complementary language.
- Optional integrations must be disableable without breaking Core routes.
- Node.js is `24.x`; npm is `11.19.1`; use `npm ci` and the repository lockfile.
- TypeScript is `6.0.3`; do not introduce a TypeScript 7 side installation.
- Every shipped slice must have automated tests and a verification command before merge.
- Do not treat ChatGPT-side connectors as web-runtime capabilities unless a documented runtime transport and authorization contract exists.
- Do not add speculative provider endpoints, credentials, OAuth scopes, or API claims.

## Review Focus

1. **Existing-vs-new duplication:** tests must prove the implementation extends the canonical routes/components rather than creating competing shells or duplicate navigation.
2. **Provider isolation:** tests must prove Core code cannot import provider implementations and that disabling an integration leaves Core routes operational.
3. **Authorization boundaries:** tests must prove user-owned data access is enforced server-side and through Supabase RLS, including negative cases.
4. **AI authority:** tests must prove generated assistance consumes authoritative application context and cannot fabricate persisted progress, schedules, achievements, or stored content.
5. **Responsive/accessibility regressions:** browser tests must prove keyboard access, accessible names, reduced-motion behavior, mobile layout, and critical route rendering.

---

### Task 1: Reconcile and harden the existing foundation

**Files:**
- Review/modify: `src/design-system/tokens/*`
- Review/modify: `src/design-system/themes/*`
- Review/modify: `src/components/ui/*`
- Review/modify: `src/components/layout/*`
- Review/modify: `src/components/navigation/*`
- Review/modify: `src/application/providers/ApplicationProviders.tsx`
- Review/modify: `src/app/layout.tsx`
- Test: existing design-system, UI, layout, navigation and provider tests

**Interfaces:**
- Preserve the existing public component contracts unless a test demonstrates a contract defect.
- `AppShell`/authenticated shell remains the canonical application chrome.
- Theme tokens remain semantic and provider/domain agnostic.

- [ ] **Step 1: Inventory the current foundation against the approved architecture.**
Run repository tree inspection and identify which requirements are already implemented versus missing; record exact files in the task notes.

- [ ] **Step 2: Write focused regression tests for the five foundation failure modes.**
Pin duplicate-shell prevention, semantic token use, keyboard focus, reduced motion, and authenticated/anonymous layout separation.

- [ ] **Step 3: Implement only the missing foundation pieces.**
Prefer reconciliation over replacement. Do not create a second design-system or navigation stack.

- [ ] **Step 4: Run focused tests.**
Run:
`npm test -- src/design-system src/components/ui src/components/layout src/components/navigation src/application/providers src/app/layout.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run static checks.**
Run `npm run lint && npm run typecheck`.
Expected: PASS.

- [ ] **Step 6: Commit.**
`git commit -m "feat: harden Academia Arcana application foundation"`

---

### Task 2: Finish the Core product experience

**Files:**
- Review/modify: `src/app/santuario/*`
- Review/modify: `src/app/academia/*`
- Review/modify: `src/app/grimorios/*`
- Review/modify: `src/app/missoes/*`
- Review/modify: `src/app/cronograma/*`
- Review/modify: `src/app/foco/*`
- Review/modify: `src/app/streak/*`
- Review/modify: `src/app/estatisticas/*`
- Review/modify: `src/app/conquistas/*`
- Review/modify: `src/app/amigos/*`
- Review/modify: `src/app/perfil/*`
- Review/modify: `src/app/personalizar/*`
- Review/modify: `src/app/configuracoes/*`
- Review/modify: corresponding `src/components/*`, `src/application/*`, `src/domains/*`
- Test: route/component tests colocated with each surface
- E2E: `tests/e2e/*`

**Interfaces:**
- Authenticated surfaces consume application services/repositories rather than calling Supabase directly from presentation components.
- Santuário consumes the existing sanctuary view model and remains the canonical authenticated landing surface.
- Grimórios/Workspace consume the existing workspace services and repository boundaries.

- [ ] **Step 1: Write failing critical-flow tests for each Core surface.**
Cover authenticated access, empty/loading/error states, navigation, keyboard interaction, and ownership-safe data loading.

- [ ] **Step 2: Verify the existing Santuário and Workspace flows before modifying them.**
Run their current test suites and inspect whether gaps are actual defects or already-satisfied requirements.

- [ ] **Step 3: Implement missing Core UI and interaction slices.**
Use existing UI primitives and the central navigation model. Keep business rules in domain/application modules.

- [ ] **Step 4: Add/repair component tests for state coverage.**
At minimum cover success, empty, loading, error and inaccessible-resource states for each newly completed surface.

- [ ] **Step 5: Add critical E2E flows.**
Cover: sign-in → Santuário → continue learning → Grimório → Caderno/Capítulo/Página → planning/focus → return to Santuário.

- [ ] **Step 6: Run focused Core verification.**
Run the colocated unit/component tests and `npm run test:e2e`.
Expected: PASS.

- [ ] **Step 7: Commit.**
`git commit -m "feat: complete Academia Arcana core learning experience"`

---

### Task 3: Consolidate the integration registry and adapter boundary

**Files:**
- Review/modify: `src/infrastructure/integrations/contracts.ts`
- Review/modify: `src/infrastructure/integrations/status.ts`
- Review/modify: `src/infrastructure/integrations/index.ts`
- Review/modify: `src/infrastructure/integrations/chatgpt-app-bridges.ts`
- Review/modify: `src/infrastructure/integrations/chatgpt-plugin-catalog.ts`
- Review/modify: existing provider files under `src/infrastructure/integrations/*`
- Review/modify: `src/app/api/integrations/status/route.ts`
- Review/modify: `src/app/integracoes/*`
- Test: integration contracts, status route, provider adapters

**Interfaces:**
- Keep a vendor-neutral integration contract with stable identifier, category, health status and server-side execution.
- Runtime states remain `catalogued`, `connected`, and `error`.
- A catalog entry alone never implies a live runtime connection.

- [ ] **Step 1: Write failing contract tests for adapter isolation.**
Assert category/type safety, disabled-provider behavior, malformed provider responses, timeout/failure normalization and absence of secret material in client-visible status.

- [ ] **Step 2: Reconcile existing provider adapters.**
Keep GitHub as the reference read-only provider and preserve existing verified/non-verified states for the other catalog entries.

- [ ] **Step 3: Add provider capability metadata.**
Represent supported operation names, required runtime transport, authorization mode, and verification status without importing ChatGPT connector internals into Core.

- [ ] **Step 4: Add failure isolation.**
A provider timeout/error must return a normalized integration error and must not crash Core routes.

- [ ] **Step 5: Add integration-hub tests.**
Verify `/integracoes` and `GET /api/integrations/status` expose only safe metadata and accurately distinguish catalogued vs connected providers.

- [ ] **Step 6: Run tests and type checks.**
Run targeted integration tests, `npm run lint`, and `npm run typecheck`.
Expected: PASS.

- [ ] **Step 7: Commit.**
`git commit -m "feat: formalize Academia Arcana integration adapters"`

---

### Task 4: Build the Intelligence/Mestre Arcano boundary

**Files:**
- Review/modify: `src/domains/intelligence/*`
- Review/modify: `src/application/intelligence/*`
- Review/modify: `src/infrastructure/intelligence/*`
- Review/modify: `src/app/api/ia-aberta/*`
- Review/modify: `src/components/intelligence/*`
- Test: domain/application/infrastructure intelligence tests plus route tests

**Interfaces:**
- AI-facing application code consumes authoritative context through typed application services.
- Provider selection belongs in infrastructure.
- AI actions must return structured results with explicit provenance/context requirements.
- AI cannot mutate protected application state without a dedicated authorized application operation.

- [ ] **Step 1: Write failing tests for authoritative context.**
Test that progress, streaks, schedules, achievements, and stored learning content are read from application services and not synthesized from prompts.

- [ ] **Step 2: Write failing tests for provider substitution.**
A provider implementation can be swapped without changing Intelligence domain contracts.

- [ ] **Step 3: Implement the intelligence orchestration boundary.**
Create typed use-cases for contextual study help, planning assistance, adaptive guidance, retrieval/search, and educational generation.

- [ ] **Step 4: Enforce action authorization.**
All state-changing AI actions call existing application use-cases rather than receiving unrestricted database clients.

- [ ] **Step 5: Add error/fallback behavior.**
When the AI provider is unavailable, return a user-safe fallback state while preserving Core functionality.

- [ ] **Step 6: Run focused intelligence tests and integration tests.**
Expected: PASS.

- [ ] **Step 7: Commit.**
`git commit -m "feat: add governed Mestre Arcano intelligence boundary"`

---

### Task 5: Harden data, security, observability and environment contracts

**Files:**
- Review/modify: `src/infrastructure/supabase/*`
- Review/modify: `supabase/migrations/*` only for confirmed required changes
- Review/modify: `.env.example`
- Review/modify: `scripts/verify-public-runtime-config.mjs`
- Review/modify: `next.config.ts`
- Review/modify: Honeybadger configuration where needed
- Review/modify: relevant security/database workflows under `.github/workflows/*`
- Test: Supabase repository/security tests and runtime-config tests

**Interfaces:**
- Public runtime configuration is validated before production build.
- Protected repositories enforce user ownership.
- Observability receives errors/telemetry without exposing secrets or sensitive application payloads.

- [ ] **Step 1: Write regression tests for environment validation.**
Cover missing Supabase URL/key, invalid URL shape, invalid key shape and optional Honeybadger configuration.

- [ ] **Step 2: Write/extend authorization regression tests.**
Cover cross-user access, update, delete, workspace movement and RPC execution grants.

- [ ] **Step 3: Inspect existing Supabase migrations before proposing any migration.**
Only create a migration when a concrete application requirement is missing; otherwise leave the current schema unchanged.

- [ ] **Step 4: Verify security headers and server/client secret boundaries.**
Ensure browser bundles do not import service-role secrets or provider credentials.

- [ ] **Step 5: Verify observability behavior.**
Confirm runtime errors are captured without making monitoring failures block normal Core requests.

- [ ] **Step 6: Run data/security verification.**
Run `npm test`, the relevant database/security workflows, and `npm run build`.
Expected: PASS.

- [ ] **Step 7: Commit.**
`git commit -m "chore: harden data security and runtime contracts"`

---

### Task 6: Complete production verification and deployment handoff

**Files:**
- Review/modify: `.github/workflows/quality.yml`
- Review/modify: `.github/workflows/production-smoke.yml`
- Review/modify: Playwright configuration and `tests/e2e/*` only where evidence shows a gap
- Review/modify: Vercel project configuration only through supported repository/configuration mechanisms
- Documentation: operational verification records

**Interfaces:**
- Quality Gate runs the repository-approved sequence on Node 24/npm 11.19.1.
- Preview and production deploy the same tested commit.
- Browser verification validates critical anonymous and authenticated paths.

- [ ] **Step 1: Write/repair the complete smoke matrix.**
Include homepage, auth routes, integration hub/status, Santuário, Grimórios/Workspace, responsive navigation and error boundaries.

- [ ] **Step 2: Run the full local verification suite.**
Run:
`npm ci`
`npm run lint`
`npm run typecheck`
`npm test`
`npm run test:a11y`
`npm run build`
`npm run test:e2e`
Expected: all PASS.

- [ ] **Step 3: Use browser verification against the resulting local build.**
Capture evidence for desktop/mobile rendering, keyboard navigation, console cleanliness, critical interaction and authenticated flow.

- [ ] **Step 4: Verify the GitHub Quality Gate for the exact release commit.**
Do not claim CI success from an older commit.

- [ ] **Step 5: Verify the Vercel Preview deployment for the same commit.**
Check deployment readiness and critical route rendering.

- [ ] **Step 6: Promote only the verified commit to production.**
Verify production alias, critical routes, runtime errors and integration status.

- [ ] **Step 7: Commit final verified corrections only.**
Use focused messages; do not bundle unrelated cleanup.

---

## Dependency / execution order

1. Task 1 must precede Tasks 2 and 6.
2. Task 2 may proceed independently after Task 1 and supplies the Core routes used by Tasks 4 and 6.
3. Task 3 may proceed after Task 1 and before Task 4; it must not require Core domain code to import providers.
4. Task 4 depends on Task 2's authoritative application services and Task 3's provider boundary.
5. Task 5 can proceed in parallel with Tasks 2–4 where changes touch separate files, but no production migration is authorized merely because the task exists.
6. Task 6 is the final gate and must use the exact commit intended for release.

## Tooling allocation

- GitHub: repository changes, branches, PR reviews, CI evidence and release commit traceability.
- Vercel: deployment, preview/production runtime, browser verification and observability.
- Supabase: Auth, PostgreSQL, RLS, schema and authorization evidence.
- Figma/Canva: visual design/source-of-truth assets; never runtime secrets.
- Mermaid: architecture and flow documentation.
- Provider integrations such as DataCamp, Quizlet, Quiz Maker, Consensus, SciSpace, Tarteel, Bible, Spotify, True Sky and others: only through the integration layer when a documented runtime transport exists.
- Notion/Dropbox/Slack/calendar and similar workflow tools: optional adapters for content/productivity flows, not Core dependencies.
- Security tools: security validation, link/provider reputation checks and operational safeguards where an actual runtime contract exists.
- Testing stack: Vitest, Testing Library, Playwright and GitHub Actions form the release evidence chain.

## Self-review against the approved specification

- Core/domain separation: Tasks 1–3.
- Product surfaces and authenticated continuity: Task 2.
- Integration contract and failure isolation: Task 3.
- AI/Mestre Arcano governance: Task 4.
- Supabase, RLS, environment and observability: Task 5.
- WCAG 2.2 AA and browser evidence: Tasks 1, 2 and 6.
- Vercel deployment and exact-commit verification: Task 6.
- Optional-provider/YAGNI constraint: enforced in Tasks 3 and 6.
