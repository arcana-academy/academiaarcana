# Santuário Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the authenticated Santuário as a resilient read-oriented projection over the existing Learning/Workspace data, with deterministic policies and explicit availability states, without creating duplicate sources of truth.

**Architecture:** UI components consume a `SanctuaryViewModel` produced by the application layer. The application layer obtains authenticated identity and domain data through repository/adapters, applies deterministic Sanctuary policies, and projects the result into UI-ready sections. Existing `grimoires → notebooks → chapters → pages` remain the source of truth; Planning and Gamification are consumed only when their contracts are actually backed by data.

**Tech Stack:** Next.js App Router, TypeScript, React, Tailwind CSS, Lucide React, Supabase, Vitest/Testing Library, ESLint, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-17-santuario-design.md`

## Global Constraints

- Santuário route: `/santuario` and authenticated only.
- UI → Application → Domain contracts → Infrastructure → Supabase; components must not query Supabase directly.
- `grimoires`, `notebooks`, `chapters`, and `pages` are the existing Learning source of truth; do not duplicate them into Sanctuary tables.
- User identity comes from the authenticated session, never from a URL/query parameter.
- Never fabricate persisted missions, streaks, progress, or schedule data; represent unavailable capabilities as `not-configured`.
- Policy decisions are deterministic and belong outside React components.
- Partial source failures must degrade per section rather than fail the entire dashboard.
- WCAG 2.2 AA, keyboard access, visible focus, semantic landmarks/headings, reduced motion, and non-color-only state communication are required.
- Preserve the existing Dark Fantasy Arcane / Arcane Academic design-system conventions.
- Every implementation task must use TDD: failing test, verify failure, minimal implementation, verify pass, commit.
- Do not modify `main` directly; implementation must use an isolated feature branch/worktree and a reviewable PR.

---

## File Map

### Create
- `src/app/santuario/page.tsx` — authenticated route entry; obtains application data and renders the Sanctuary shell.
- `src/app/santuario/loading.tsx` — route-level skeleton.
- `src/app/santuario/error.tsx` — route-level recovery UI for fatal failures.
- `src/application/sanctuary/get-sanctuary.ts` — application use case that gathers context, invokes policies, and returns the view model.
- `src/application/sanctuary/sanctuary-view-model.ts` — stable UI projection types and mapping helpers.
- `src/application/sanctuary/policies/learning-policy.ts` — deterministic selection of Continue Learning context.
- `src/application/sanctuary/policies/mission-policy.ts` — mission availability/projection policy backed only by real gamification data.
- `src/application/sanctuary/policies/planning-policy.ts` — schedule availability/projection policy backed only by real planning data.
- `src/application/sanctuary/policies/priority-policy.ts` — deterministic primary-action and section-priority policy.
- `src/components/sanctuary/Sanctuary.tsx` — page composition and section-state rendering.
- `src/components/sanctuary/SanctuaryHeader.tsx` — identity, greeting, and primary action.
- `src/components/sanctuary/ContinueLearning.tsx` — real Learning/Workspace continuation card.
- `src/components/sanctuary/DailyMissions.tsx` — mission section with empty/not-configured/error states.
- `src/components/sanctuary/ProgressSummary.tsx` — progress section with explicit availability.
- `src/components/sanctuary/SchedulePreview.tsx` — planning section with explicit availability.
- `src/components/sanctuary/QuickActions.tsx` — links to existing product areas only.
- `src/components/sanctuary/SanctuaryEmptyState.tsx` — no-content state.
- `src/domains/sanctuary/contracts.ts` — domain contracts for snapshot, sections, priorities, and source availability.
- `src/domains/sanctuary/policies.ts` — policy-facing domain types/exports without UI dependencies.
- `src/domains/sanctuary/types.ts` — Sanctuary-specific value types.
- `src/domains/sanctuary/index.ts` — public domain exports.
- `src/infrastructure/sanctuary/sanctuary-repository.ts` — infrastructure-facing repository contract/adapter boundary.
- `src/infrastructure/sanctuary/supabase-sanctuary-repository.ts` — Supabase implementation using the authenticated client and existing RLS-protected Learning tables.

### Tests
- `src/domains/sanctuary/contracts.test.ts`
- `src/domains/sanctuary/policies.test.ts`
- `src/application/sanctuary/get-sanctuary.test.ts`
- `src/application/sanctuary/policies/learning-policy.test.ts`
- `src/application/sanctuary/policies/mission-policy.test.ts`
- `src/application/sanctuary/policies/planning-policy.test.ts`
- `src/application/sanctuary/policies/priority-policy.test.ts`
- `src/components/sanctuary/*.test.tsx` for each interactive/rendering component
- `src/app/santuario/page.test.tsx` where the existing app-test conventions support route testing
- E2E coverage in the repository's established Playwright location for authenticated route access, empty state, and resilient partial state.

---

## Task 1: Establish Sanctuary domain contracts

**Files:**
- Create: `src/domains/sanctuary/contracts.ts`
- Create: `src/domains/sanctuary/types.ts`
- Create: `src/domains/sanctuary/policies.ts`
- Create: `src/domains/sanctuary/index.ts`
- Test: `src/domains/sanctuary/contracts.test.ts`
- Test: `src/domains/sanctuary/policies.test.ts`

**Interfaces:**
- Produce `FeatureAvailability`, `SectionState<T>`, `SanctuaryPriority`, `SanctuaryUser`, `ContinueLearning`, `SanctuaryMission`, `ProgressSummary`, `ScheduleItem`, `QuickAction`, `SanctuarySnapshot`, `SanctuaryPolicyContext`, and `SanctuaryViewModel` contracts consistent with the approved design.
- Keep `SanctuaryViewModel` a projection; do not copy Learning repository interfaces into it.

- [ ] **Step 1: Write failing contract tests** covering all availability states, the authenticated user identity shape, nullable Continue Learning, and the complete view-model section set.
- [ ] **Step 2: Run the focused Vitest files and verify they fail because the contracts do not yet exist.**
- [ ] **Step 3: Implement the minimal domain types and exports.**
- [ ] **Step 4: Run the focused Vitest files and verify they pass.**
- [ ] **Step 5: Commit** `feat(sanctuary): define domain contracts`.

## Task 2: Build the Learning repository adapter

**Files:**
- Create: `src/infrastructure/sanctuary/sanctuary-repository.ts`
- Create: `src/infrastructure/sanctuary/supabase-sanctuary-repository.ts`
- Test: `src/infrastructure/sanctuary/supabase-sanctuary-repository.test.ts`

**Interfaces:**
- `SanctuaryRepository` must expose authenticated reads required to construct Learning context and identity without accepting a caller-supplied user ID.
- The Supabase implementation consumes the existing authenticated Supabase client and queries only RLS-protected data.

- [ ] **Step 1: Write failing adapter tests for owner-scoped grimoires and nested notebooks/chapters/pages, including empty results.**
- [ ] **Step 2: Run the focused adapter tests and verify failure.**
- [ ] **Step 3: Implement the repository boundary and Supabase adapter using the existing client conventions in the repository.**
- [ ] **Step 4: Run adapter tests and verify pass; explicitly verify no user ID can be supplied to bypass session identity.**
- [ ] **Step 5: Commit** `feat(sanctuary): add learning data adapter`.

## Task 3: Implement Continue Learning policy

**Files:**
- Create: `src/application/sanctuary/policies/learning-policy.ts`
- Test: `src/application/sanctuary/policies/learning-policy.test.ts`

**Interfaces:**
- Produce a deterministic `selectContinueLearning(context): ContinueLearning | null` function.
- Priority: valid known learning context → chapter → notebook → valid grimoire → null/empty.
- Never claim a page is the last visited page unless the supplied context actually establishes that fact.

- [ ] **Step 1: Write failing tests for page, chapter, notebook, grimoire-only, and no-content cases.**
- [ ] **Step 2: Run the policy tests and verify failure.**
- [ ] **Step 3: Implement the minimal deterministic policy and route construction.**
- [ ] **Step 4: Run policy tests and verify pass.**
- [ ] **Step 5: Commit** `feat(sanctuary): add learning continuation policy`.

## Task 4: Implement Planning, Gamification, and availability policies

**Files:**
- Create: `src/application/sanctuary/policies/mission-policy.ts`
- Create: `src/application/sanctuary/policies/planning-policy.ts`
- Test: `src/application/sanctuary/policies/mission-policy.test.ts`
- Test: `src/application/sanctuary/policies/planning-policy.test.ts`

**Interfaces:**
- Each policy accepts its domain context and returns an explicit `SectionState<T>`.
- Contract-only or absent backing data must return `not-configured`, never invented content.
- Real empty datasets return `empty`; successful real datasets return `ready`; source exceptions return `error` with a safe user-facing message.

- [ ] **Step 1: Write failing tests for `ready`, `empty`, `not-configured`, and `error` for both planning and gamification.**
- [ ] **Step 2: Run the tests and verify failure.**
- [ ] **Step 3: Implement the two minimal policies.**
- [ ] **Step 4: Run the focused tests and verify pass.**
- [ ] **Step 5: Commit** `feat(sanctuary): model planning and mission availability`.

## Task 5: Implement deterministic priority policy

**Files:**
- Create: `src/application/sanctuary/policies/priority-policy.ts`
- Test: `src/application/sanctuary/policies/priority-policy.test.ts`

**Interfaces:**
- Produce `decideSanctuaryPriority(context): SanctuaryDecision`.
- Primary action selection must prefer valid learning continuation, then available meaningful mission/schedule actions, then an existing quick action appropriate to the available product state.
- Return semantic priorities (`primary`, `secondary`, `supporting`) and explicit reasons rather than arbitrary numeric scores.

- [ ] **Step 1: Write failing tests for new user, learning-context user, no-history user, partial-source user, and no-content user.**
- [ ] **Step 2: Run tests and verify failure.**
- [ ] **Step 3: Implement deterministic decision rules.**
- [ ] **Step 4: Run tests and verify pass.**
- [ ] **Step 5: Commit** `feat(sanctuary): add deterministic priority policy`.

## Task 6: Compose the application use case and view model

**Files:**
- Create: `src/application/sanctuary/get-sanctuary.ts`
- Create: `src/application/sanctuary/sanctuary-view-model.ts`
- Test: `src/application/sanctuary/get-sanctuary.test.ts`

**Interfaces:**
- Produce `getSanctuary(repository, sessionContext): Promise<SanctuaryViewModel>`.
- Gather independent section sources without allowing one optional section failure to abort the whole projection.
- Convert domain results into the stable view model consumed by React.

- [ ] **Step 1: Write failing application tests for full data, empty user, and partial failures.**
- [ ] **Step 2: Run tests and verify failure.**
- [ ] **Step 3: Implement the application orchestration and projection.**
- [ ] **Step 4: Run application tests and verify pass.**
- [ ] **Step 5: Commit** `feat(sanctuary): compose sanctuary view model`.

## Task 7: Build the route shell and resilient UI states

**Files:**
- Create: `src/app/santuario/page.tsx`
- Create: `src/app/santuario/loading.tsx`
- Create: `src/app/santuario/error.tsx`
- Create: `src/components/sanctuary/Sanctuary.tsx`
- Create: `src/components/sanctuary/SanctuaryEmptyState.tsx`
- Test: corresponding route/component tests

**Interfaces:**
- Route receives authentication/session context from the established application auth mechanism.
- `Sanctuary` consumes only `SanctuaryViewModel`; it does not import Supabase or repository implementations.
- `SectionState` determines section rendering; JSX does not contain domain-priority logic.

- [ ] **Step 1: Write failing tests for loading, fatal error, ready, empty, and partial states.**
- [ ] **Step 2: Run focused tests and verify failure.**
- [ ] **Step 3: Implement the route and shell with section-level degradation.**
- [ ] **Step 4: Run tests and verify pass.**
- [ ] **Step 5: Commit** `feat(sanctuary): add authenticated route shell`.

## Task 8: Implement Sanctuary sections and accessibility behavior

**Files:**
- Create: `src/components/sanctuary/SanctuaryHeader.tsx`
- Create: `src/components/sanctuary/ContinueLearning.tsx`
- Create: `src/components/sanctuary/DailyMissions.tsx`
- Create: `src/components/sanctuary/ProgressSummary.tsx`
- Create: `src/components/sanctuary/SchedulePreview.tsx`
- Create: `src/components/sanctuary/QuickActions.tsx`
- Test: each component's `.test.tsx`

**Interfaces:**
- Components consume typed view-model sections and explicit availability states.
- Buttons/links point only to existing routes or intentionally configured destinations.
- Visual hierarchy follows Dark Fantasy Arcane design tokens already used by the project.

- [ ] **Step 1: Write failing component tests for keyboard navigation, semantic headings/landmarks, visible focus, state text, and reduced-motion-safe behavior where applicable.**
- [ ] **Step 2: Run focused component tests and verify failure.**
- [ ] **Step 3: Implement the components using existing design-system patterns and Lucide icons.**
- [ ] **Step 4: Run component tests and verify pass.**
- [ ] **Step 5: Commit** `feat(sanctuary): build sanctuary sections`.

## Task 9: Integrate authenticated navigation and Workspace relationship

**Files:**
- Modify: existing authenticated navigation/layout files identified during implementation after inspecting current route/navigation conventions.
- Test: affected navigation tests and Santuário E2E tests.

**Interfaces:**
- Add `/santuario` to the authenticated navigation hierarchy without duplicating Workspace content navigation.
- Keep Workspace as the content/navigation shell; Santuário is the contextual home/dashboard.

- [ ] **Step 1: Write failing navigation tests for authenticated access and Santuário → Workspace continuation.**
- [ ] **Step 2: Run tests and verify failure.**
- [ ] **Step 3: Implement the smallest navigation integration consistent with existing shell patterns.**
- [ ] **Step 4: Run navigation tests and verify pass.**
- [ ] **Step 5: Commit** `feat(sanctuary): integrate sanctuary navigation`.

## Task 10: Add end-to-end coverage and production verification

**Files:**
- Modify/create: repository's established Playwright E2E files for authenticated Sanctuary flows.
- Modify only if required: deployment/runtime configuration needed to execute the route correctly.

- [ ] **Step 1: Write failing E2E tests for unauthenticated access, authenticated empty state, authenticated learning continuation, and partial availability.**
- [ ] **Step 2: Run the E2E tests and verify expected failures before implementation changes are considered complete.**
- [ ] **Step 3: Implement only fixes exposed by E2E behavior; do not broaden scope.**
- [ ] **Step 4: Run the complete E2E suite and verify pass.**
- [ ] **Step 5: Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`; record exact results.**
- [ ] **Step 6: Verify `git diff --check` and repository status.**
- [ ] **Step 7: Commit** `test(sanctuary): verify end-to-end sanctuary flow` if verification-only changes were required.

## Task 11: Final review and integration preparation

**Files:**
- No new implementation files unless review identifies a concrete defect.

- [ ] **Step 1: Review the complete diff against `docs/superpowers/specs/2026-09-17-santuario-design.md`.**
- [ ] **Step 2: Verify no fake persisted data, direct component-to-Supabase access, URL user identity, arbitrary priority scores, or duplicate Learning source of truth were introduced.**
- [ ] **Step 3: Run the full verification suite again after the final diff is stable.**
- [ ] **Step 4: Request code review using the project's review workflow.**
- [ ] **Step 5: Use the finishing-development-branch workflow to prepare the implementation PR for merge; do not merge automatically without the user's explicit integration choice.**

## Execution Order

Tasks 1–6 establish the domain/application core. Tasks 7–9 build the route/UI integration. Task 10 verifies the complete flow. Task 11 is the final review gate. No task may bypass its focused test cycle, and no implementation should begin until this approved plan is being executed in an isolated feature workspace.

## Out of Scope

- New persistent Sanctuary database tables.
- New Gamification persistence or Planning persistence unrelated to enabling existing contracts.
- Rebuilding the Workspace.
- Replacing the authentication architecture.
- Redesigning the entire application design system.
- AI-generated recommendations or probabilistic ranking in the first Santuário implementation.
- Fake missions, fake streaks, fake schedule items, or fabricated learning history.
