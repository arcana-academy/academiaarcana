# Asana Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a secure, optional Asana integration for Academia Arcana that complements the Planning domain and leaves Vercel as the only intentionally remaining deployment/infrastructure step.

**Architecture:** Reuse the existing vendor-neutral integration boundary and Todoist's server-side OAuth pattern. Add an Asana provider adapter, authenticated API routes, an integration page/hub entry, and an explicit `StudyTask -> Asana task` action without introducing durable two-way synchronization.

**Tech Stack:** Next.js App Router, TypeScript, React, existing integration contracts, server-side Web Crypto, Asana REST API, Vitest/Testing Library, Playwright, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-29-asana-integration-design.md`

## Global Constraints

- Supabase remains the source of truth for Academy identity, learning data, progress, missions, XP, streaks, achievements and `StudyTask`.
- Asana credentials are server-side only and must never be returned to browser JavaScript, logs, telemetry or public status payloads.
- The v1 integration uses OAuth 2.0 Authorization Code Grant with state + PKCE and the minimum configured scopes.
- No generic Asana proxy endpoint is allowed.
- No durable two-way StudyTask <-> Asana synchronization, webhooks or background reconciliation in v1.
- No Vercel deployment, production promotion or production environment mutation is part of this implementation.

## Review Focus

1. OAuth callback replay or session mismatch must reject authorization and clear temporary state.
2. Expired/revoked Asana credentials must become a deterministic reauthorization-required/disconnected state without leaking tokens.
3. Provider failures and rate limits must not break native Academy planning or task completion.
4. Duplicate clicks on `Enviar ao Asana` must not create accidental duplicate requests within one UI interaction.
5. Malformed provider/user payloads must be rejected without storing unvalidated external identifiers.

---

### Task 1: Provider adapter and contracts

**Files:**
- Create: `src/infrastructure/integrations/asana.ts`
- Modify: `src/infrastructure/integrations/index.ts`
- Test: `src/infrastructure/integrations/asana.test.ts`

**Interfaces:**
- Produces `ASANA_INTEGRATION_DEFINITION`, OAuth helpers, credential encryption/decryption, token exchange/refresh/revoke, verification, project/task operations, and normalized Asana errors for later routes.
- Reuses `IntegrationDefinition` and `IntegrationToolResult` from `contracts.ts`.

- [ ] **Step 1: Write failing adapter tests** for OAuth URL construction, PKCE/state generation, credential round-trip, malformed credential rejection, token refresh timing, HTTP 401/403 mapping, project/task payload normalization and credential omission from result objects.
- [ ] **Step 2: Run the focused Vitest file and verify it fails** because the Asana adapter does not yet exist.
- [ ] **Step 3: Implement the adapter** with constants for provider ID, API/OAuth URLs, cookies, scopes and server-only environment access; implement authenticated fetch, connection verification, project/task reads, task creation, task completion, revoke, AES-GCM credential storage, and state/PKCE helpers.
- [ ] **Step 4: Run the focused Vitest file and verify all adapter tests pass.**
- [ ] **Step 5: Export the provider from `src/infrastructure/integrations/index.ts`.**
- [ ] **Step 6: Commit** with `feat: add Asana integration adapter`.

### Task 2: OAuth and authenticated Asana API routes

**Files:**
- Create: `src/app/api/integrations/asana/connect/route.ts`
- Create: `src/app/api/integrations/asana/callback/route.ts`
- Create: `src/app/api/integrations/asana/status/route.ts`
- Create: `src/app/api/integrations/asana/projects/route.ts`
- Create: `src/app/api/integrations/asana/tasks/route.ts`
- Create: `src/app/api/integrations/asana/disconnect/route.ts`
- Test: `src/app/api/integrations/asana/*.test.ts`

**Interfaces:**
- Authenticated routes use `requireAuthenticatedUser()` and bind stored credentials to `claims.sub`.
- Status returns only sanitized provider state and safe account metadata.
- Project/task endpoints return minimum required fields for UI use.
- POST/PATCH task endpoints preserve Academy source-of-truth semantics.

- [ ] **Step 1: Write failing route tests** covering unauthenticated access, invalid OAuth state, successful callback with mocked provider exchange, subject mismatch, disconnected state, refresh path, project/task reads, task creation, task completion, and disconnect.
- [ ] **Step 2: Run focused route tests and verify failure.**
- [ ] **Step 3: Implement routes by following the existing Todoist server-side pattern, replacing provider-specific operations with the Asana adapter.**
- [ ] **Step 4: Verify routes pass focused tests and no response contains credential material.**
- [ ] **Step 5: Commit** with `feat: add Asana OAuth and API routes`.

### Task 3: Integration hub and authenticated Asana management page

**Files:**
- Create: `src/app/integracoes/asana/page.tsx`
- Create: reusable Asana UI component(s) only if needed under `src/components/integrations/`
- Modify: `src/app/integracoes/page.tsx`
- Modify: `src/app/configuracoes/page.tsx`
- Modify: existing integration status/catalog source used by the hub
- Tests: existing integration component tests plus new `tests/e2e/asana-integration.spec.ts`

**Interfaces:**
- Page consumes `/api/integrations/asana/status`, projects and tasks.
- Hub exposes Asana as a runtime-capable provider whose status is honest: catalogued/not_configured/connected/error.
- UI must follow established Academia Arcana tokens and accessibility patterns.

- [ ] **Step 1: Add failing UI/E2E assertions** for Asana card, management navigation, connection state, empty/error states, and no-secret status payload.
- [ ] **Step 2: Run focused tests and verify failure.**
- [ ] **Step 3: Implement the authenticated management page and hub/configuration links.**
- [ ] **Step 4: Verify keyboard/focus/error/loading behavior and pass the focused tests.**
- [ ] **Step 5: Commit** with `feat: add Asana integration management UI`.

### Task 4: StudyTask -> Asana planning action

**Files:**
- Modify: `src/components/planning/StudyTaskBoard.tsx`
- Modify: `src/app/cronograma/page.tsx` only if wiring is required
- Modify: `src/app/cronograma/actions.ts` only if a server action boundary is preferable to direct API fetches
- Create/modify tests adjacent to the planning component/action

**Interfaces:**
- Adds an explicit external action named consistently with the Asana UI, such as `createAsanaTask`.
- Sends title, description, due datetime and optional project ID.
- Native `StudyTask` creation/completion remains unchanged if Asana is disconnected.

- [ ] **Step 1: Write failing planning tests** for disconnected handling, successful send, duplicate-click protection during request, API error handling, and confirmation of external-copy semantics.
- [ ] **Step 2: Run focused tests and verify failure.**
- [ ] **Step 3: Implement the explicit Asana action, preserving the existing Todoist action and native planning flow.**
- [ ] **Step 4: Verify the planning tests pass and the UI remains accessible.**
- [ ] **Step 5: Commit** with `feat: add Asana task export from planning`.

### Task 5: Documentation and configuration contract

**Files:**
- Create: `docs/integrations/asana.md`
- Modify: `docs/engineering/project-integrations.md`
- Modify: `.env.example` if present; otherwise add the documented environment section to the existing configuration documentation
- Modify: integration catalog/status registration files as required

**Interfaces:**
- Documents exactly the implemented routes, scopes, credentials, security model, supported operations, current status semantics and non-goals.
- Explicitly distinguishes the Asana web API runtime integration from the Asana ChatGPT connector.

- [ ] **Step 1: Write documentation assertions/checks** for required variables and route list.
- [ ] **Step 2: Implement documentation and configuration naming.**
- [ ] **Step 3: Verify documentation matches code and contains no invented provider behavior.**
- [ ] **Step 4: Commit** with `docs: document Asana integration`.

### Task 6: Full quality validation and corrective pass

**Files:** repository-wide as required by failures.

- [ ] **Step 1: Run `npm run lint`.**
- [ ] **Step 2: Run `npm run typecheck`.**
- [ ] **Step 3: Run `npm test`.**
- [ ] **Step 4: Run `npm run test:a11y`.**
- [ ] **Step 5: Run `npm run build`.**
- [ ] **Step 6: Run `npm run test:e2e`.**
- [ ] **Step 7: If any check fails, fix the actual failure and rerun the failed check plus its regression test before moving on.**
- [ ] **Step 8: Inspect the final GitHub diff for accidental secrets, duplicated provider logic, incorrect status claims and unrelated changes.**
- [ ] **Step 9: Commit the final corrective changes** only after fresh verification.

### Task 7: Release-readiness handoff

**Files:** none unless validation reveals a documentation/status correction.

- [ ] **Step 1: Verify the exact final commit is the commit tested by the local quality suite.**
- [ ] **Step 2: Verify the integration documentation and hub status agree with the implementation.**
- [ ] **Step 3: Verify no Vercel action was performed.**
- [ ] **Step 4: Record the remaining external prerequisites for a real user connection: Asana OAuth application credentials and exact registered redirect URI.**
- [ ] **Step 5: Commit any final metadata-only correction if required.
