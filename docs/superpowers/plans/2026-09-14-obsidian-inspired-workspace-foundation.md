# Academia Arcana — Workspace Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Workspace Foundation for the Academia Arcana using the canonical hierarchy Grimório → Caderno → Capítulo → Página, isolated application/domain contracts, Supabase repositories with RLS, and an accessible Arcana-native workspace UI.

**Architecture:** Keep the Workspace as a bounded learning capability. UI components consume application services; application services depend on domain contracts; Supabase adapters implement repository contracts. Navigation state has one source of truth, while authorization remains enforced both in application logic and PostgreSQL RLS.

**Tech Stack:** Next.js App Router, TypeScript, React, Tailwind CSS, Lucide React, Supabase/PostgreSQL, Vitest, Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-14-obsidian-inspired-workspace-foundation-design.md`

## Global Constraints

- Canonical hierarchy: **Grimório → Caderno → Capítulo → Página**.
- UI must not call `supabase.from(...)` directly.
- `Page.content` must use a domain contract rather than an editor-specific representation.
- Ownership is resolved through the hierarchy; do not add duplicated child `user_id` fields without evidence that the existing schema requires them.
- RLS protects `SELECT`, `INSERT`, `UPDATE`, and `DELETE` and is defense in depth, not a replacement for application authorization.
- No service-role/admin key may reach the frontend.
- Preserve existing themes, fonts, accessibility behavior, and non-white/pure-white visual surfaces.
- Keep backlinks, graph, realtime collaboration, full versioning, comments, AI, semantic search, linked flashcards, mind maps, offline sync, and advanced attachments out of this foundation.

---

## Repository Baseline and File Map

The repository already separates `src/domains`, `src/application`, `src/infrastructure/supabase`, and UI components. The existing learning domain exposes a placeholder `contracts.ts`, so the Workspace contracts should extend that boundary rather than introduce a parallel architecture.

Planned files:

- Create/modify `src/domains/learning/*`: Workspace entities, content contract, repository interfaces, validation types, and unit tests.
- Create/modify `src/application/learning/*`: Workspace application services and navigation state/use-case contracts.
- Create/modify `src/infrastructure/supabase/*`: concrete Workspace repositories and tests, using the existing Supabase clients.
- Create/modify the existing Supabase migration location discovered from the repository: Workspace tables, foreign keys, indexes, RLS policies, and migration tests/documentation.
- Create/modify `src/components/*` Workspace components: `Workspace`, `WorkspaceHeader`, `WorkspaceTree`, `WorkspaceContent`, `PageEditor`, `WorkspaceContextPanel`, plus focused tests.
- Create/modify the appropriate App Router route discovered from the existing learning/grimoire routes; do not create a competing route.
- Add Playwright coverage under `tests/e2e/` for the critical workspace journey and authorization-safe failure states.

Before changing any file, inspect the current analogous domain/application/repository/route implementation and preserve its established naming, dependency injection, and test conventions.

---

### Task 1: Establish Workspace domain contracts

**Files:**
- Create/modify: `src/domains/learning/workspace.ts`
- Create/modify: `src/domains/learning/contracts.ts`
- Create: `src/domains/learning/workspace.test.ts`

**Interfaces:**
- Produces `Grimoire`, `Notebook`, `Chapter`, `Page`, `PageContent`, `WorkspaceState`, and repository interfaces for later tasks.
- Repository methods must cover the approved contract: create, getById, list, update, delete, and reorder where applicable.

- [ ] **Step 1: Write failing domain contract tests** covering entity shape, hierarchy identifiers, valid `position`, and the requirement that page content is represented by a domain type rather than `string`/HTML-specific fields.
- [ ] **Step 2: Run the focused test** with `npm test -- src/domains/learning/workspace.test.ts` and confirm the new contracts are missing.
- [ ] **Step 3: Implement the minimal domain contracts** and export them through the existing learning boundary.
- [ ] **Step 4: Run the focused test again** and confirm it passes.
- [ ] **Step 5: Run `npm run typecheck`** to catch import/export inconsistencies.
- [ ] **Step 6: Commit** with `feat(learning): define workspace domain contracts`.

### Task 2: Add Workspace application services and single navigation state

**Files:**
- Create: `src/application/learning/workspace/state.ts`
- Create: `src/application/learning/workspace/service.ts`
- Create: `src/application/learning/workspace/service.test.ts`

**Interfaces:**
- Consumes the domain repository interfaces from Task 1.
- Produces `WorkspaceState` and operations `openGrimoire`, `openNotebook`, `openChapter`, `openPage`, `createNotebook`, `createChapter`, `createPage`, `rename`, `delete`, `move`, and `reorder`.

- [ ] **Step 1: Write failing tests** proving that selecting a page preserves the complete hierarchical context and that child mutations require the correct parent context.
- [ ] **Step 2: Run the focused tests** and confirm failure.
- [ ] **Step 3: Implement the smallest service/state layer** with one source of truth and explicit authorization/context checks before repository calls.
- [ ] **Step 4: Add failure recovery tests** for rename/reorder persistence failures so local state does not remain permanently divergent from the server.
- [ ] **Step 5: Run the focused tests and typecheck** and confirm both pass.
- [ ] **Step 6: Commit** with `feat(application): add workspace state and services`.

### Task 3: Implement Supabase persistence, relational integrity, indexes, and RLS

**Files:**
- Create: the Workspace migration in the repository's existing Supabase migration directory.
- Create: `src/infrastructure/supabase/workspace-repositories.ts` or the repository's established equivalent.
- Create: repository tests next to the adapter using the existing infrastructure test conventions.

**Interfaces:**
- Consumes repository contracts from Task 1 and existing Supabase browser/server clients.
- Produces concrete repositories for Grimórios, Cadernos, Capítulos, and Páginas.

- [ ] **Step 1: Inspect the current database/migrations** and identify whether equivalent `grimoires`, `notebooks`, `chapters`, or `pages` tables already exist. Reuse compatible schema; do not create duplicate concepts.
- [ ] **Step 2: Write failing migration/repository tests** for foreign-key integrity, ordering, ownership traversal, and cross-user denial.
- [ ] **Step 3: Add only the required schema changes**: canonical foreign keys, explicit delete behavior, required indexes, and RLS policies for all four operations.
- [ ] **Step 4: Add/update repository adapters** so no UI or application code needs `supabase.from(...)`.
- [ ] **Step 5: Validate policies with positive and negative cases** for two authenticated users, including direct access by known IDs.
- [ ] **Step 6: Run the repository/migration test suite** using the project's existing Supabase test mechanism; document any environment prerequisite instead of bypassing security tests.
- [ ] **Step 7: Run `npm run typecheck` and `git diff --check`**.
- [ ] **Step 8: Commit** with `feat(data): add workspace persistence and rls`.

### Task 4: Build the Workspace shell and hierarchy tree

**Files:**
- Create/modify: the existing Workspace component directory under `src/components`.
- Create: focused component tests for `WorkspaceHeader`, `WorkspaceTree`, and the shell.

**Interfaces:**
- Consumes `WorkspaceState` and application callbacks from Task 2.
- Produces an accessible three-region shell: header, navigation tree, and content/context areas.

- [ ] **Step 1: Write failing component tests** for hierarchical rendering, keyboard-accessible selection, expanded/collapsed groups, empty states, and selected-page context.
- [ ] **Step 2: Implement `Workspace`, `WorkspaceHeader`, and `WorkspaceTree`** with focused responsibilities; keep business logic outside the visual tree.
- [ ] **Step 3: Add explicit loading, empty, and error states** without exposing SQL, stack traces, or infrastructure details.
- [ ] **Step 4: Validate keyboard navigation and accessible names** with Testing Library.
- [ ] **Step 5: Validate the existing theme tokens** and ensure no pure-white surface/text is introduced.
- [ ] **Step 6: Run focused tests and lint**.
- [ ] **Step 7: Commit** with `feat(ui): add workspace navigation shell`.

### Task 5: Add page content, contextual panel, CRUD, and reorder interactions

**Files:**
- Create/modify: `WorkspaceContent` and `PageEditor`.
- Create/modify: `WorkspaceContextPanel`.
- Create: focused tests for creation, rename, deletion, reorder, and invalid parent relationships.

**Interfaces:**
- Consumes application services from Task 2.
- Uses the domain `PageContent` contract from Task 1.

- [ ] **Step 1: Write failing tests** for page rendering, creation under the selected parent, rename cancel/confirm, descendant-aware deletion confirmation, and reorder persistence.
- [ ] **Step 2: Implement `WorkspaceContent` and `PageEditor`** without coupling the content model to HTML/Markdown/editor internals.
- [ ] **Step 3: Implement contextual metadata/progress/actions** in `WorkspaceContextPanel` without introducing future out-of-scope features.
- [ ] **Step 4: Implement CRUD/reorder flows** through the application service only.
- [ ] **Step 5: Add tests proving invalid parent IDs are rejected before persistence.**
- [ ] **Step 6: Run focused tests, typecheck, and lint**.
- [ ] **Step 7: Commit** with `feat(workspace): add content and organization flows`.

### Task 6: Implement autosave and resilient UI states

**Files:**
- Create: `src/application/learning/workspace/autosave.ts`
- Create: `src/application/learning/workspace/autosave.test.ts`
- Modify: `PageEditor` and related UI tests.

**Interfaces:**
- Consumes page update service from Task 2.
- Produces observable states: `Editando`, `Salvando`, `Salvo`, `Falha ao salvar`.

- [ ] **Step 1: Write failing tests** for debounce, save success, save failure, replacement by newer content, and recovery after failure.
- [ ] **Step 2: Implement debounce and cancellation/race protection** so an older save cannot overwrite a newer edit.
- [ ] **Step 3: Surface the four approved states** in `PageEditor` with accessible status text.
- [ ] **Step 4: Test recovery** after a transient persistence failure.
- [ ] **Step 5: Run focused tests and lint**.
- [ ] **Step 6: Commit** with `feat(workspace): add resilient page autosave`.

### Task 7: Integrate the Workspace into the existing App Router

**Files:**
- Modify: the existing canonical learning/grimoire route identified during baseline inspection.
- Modify: the existing application provider/layout only if required by the current architecture.
- Create/modify: route-level tests.

**Interfaces:**
- Consumes the completed Workspace shell/application service.
- Produces the user-facing canonical Workspace entry point without introducing a competing route.

- [ ] **Step 1: Identify the existing route and its data-loading boundary.**
- [ ] **Step 2: Write failing route tests** for authenticated access, missing resources, unauthorized resources, and initial hierarchy selection.
- [ ] **Step 3: Integrate the Workspace using the existing server/client boundary conventions.**
- [ ] **Step 4: Ensure unauthorized resources return a safe state without disclosing existence.**
- [ ] **Step 5: Run route tests and production build.**
- [ ] **Step 6: Commit** with `feat(app): integrate workspace foundation`.

### Task 8: Add end-to-end and security regression coverage

**Files:**
- Create/modify: `tests/e2e/workspace.spec.ts`.
- Modify: existing Playwright configuration only when required by the current test setup.

**Interfaces:**
- Consumes the complete Workspace from Tasks 1–7.
- Produces browser-level evidence for the critical learning journey and authorization-safe behavior.

- [ ] **Step 1: Write E2E scenarios** for opening a Grimório, navigating Caderno → Capítulo → Página, creating content, renaming, reordering, and observing autosave.
- [ ] **Step 2: Add negative E2E coverage** for direct navigation to a resource that belongs to another user and verify that no private metadata/content is disclosed.
- [ ] **Step 3: Run Playwright against the project's supported local environment.**
- [ ] **Step 4: Fix only failures caused by the Workspace implementation; do not weaken security assertions to make the suite pass.**
- [ ] **Step 5: Commit** with `test(workspace): cover critical user and security flows`.

### Task 9: Full verification and quality-gate handoff

**Files:**
- No new production files unless verification exposes a real defect.
- Documentation may be updated only for confirmed operational prerequisites.

- [ ] **Step 1: Run `npm run typecheck`.**
- [ ] **Step 2: Run `npm test`.**
- [ ] **Step 3: Run `npm run lint`.**
- [ ] **Step 4: Run `npm run build`.**
- [ ] **Step 5: Run `git diff --check`.**
- [ ] **Step 6: Run the complete Playwright suite.**
- [ ] **Step 7: Review the final diff for accidental scope expansion, direct Supabase calls in UI, white/pure-white surfaces, missing negative tests, and security regressions.**
- [ ] **Step 8: Verify the GitHub Actions quality/security checks before claiming completion.**
- [ ] **Step 9: Commit any verified final corrections separately with a focused message.**

---

## Self-review against the approved specification

- Domain hierarchy and contracts: Task 1.
- Repository/application separation: Tasks 2–3.
- Single Workspace navigation state: Task 2.
- Three-region visual architecture: Task 4.
- CRUD/reorder: Task 5.
- Autosave states and recovery: Task 6.
- Loading/empty/error/unauthorized behavior: Tasks 4, 5, and 7.
- Responsive shell: Task 4 and route integration in Task 7.
- Ownership/RLS/foreign keys/indexes: Task 3.
- Positive and negative security evidence: Tasks 3 and 8.
- Explicit out-of-scope features: Global Constraints and Tasks 5–9.
- Final acceptance criteria: Task 9.

No task requires a placeholder, and later tasks consume only interfaces explicitly produced by earlier tasks.
