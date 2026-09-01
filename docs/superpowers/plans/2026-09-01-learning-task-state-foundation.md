# Learning Task State Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans (recommended). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a typed, accessible task-state foundation inspired by the strongest Obsidian/Things interaction patterns without coupling the learning domain to a specific UI or persistence implementation.

**Architecture:** Task state is owned by the Learning domain. UI components consume typed state and presentation metadata only. This slice deliberately does not add database persistence, scheduling, gamification, or plugin infrastructure; those belong to later domain-specific implementations.

**Tech Stack:** TypeScript, React 19, Vitest, Testing Library, existing Academia Arcana UI/token system.

**Spec:** `docs/superpowers/specs/2026-08-31-academia-arcana-architecture-design.md` plus the Obsidian/Things reference analysis from the current implementation request.

## Global Constraints

- Task status is domain data, not decoration.
- Priority and status remain separate concepts.
- Components must not contain domain transition rules.
- No hard-coded theme-specific colors in the task component.
- The task state UI must remain understandable without color alone.
- The feature must work with keyboard and assistive technology.
- No persistence or cross-domain side effects are introduced in this slice.

---

### Task 1: Define the Learning task state contract

**Files:**
- Create: `src/domains/learning/tasks/types.ts`
- Create: `src/domains/learning/tasks/state.ts`
- Test: `src/domains/learning/tasks/state.test.ts`

**Interfaces:**
- `TaskStatus` is `todo | in_progress | done | cancelled | scheduled | blocked | question | idea`.
- `TaskPriority` is `low | normal | high | urgent`.
- `canTransitionTaskStatus(from, to)` validates allowed state transitions.
- `getTaskStatusLabel(status)` returns the Portuguese accessible label.
- `getTaskStatusSymbol(status)` returns a stable text symbol that does not rely on color.

- [ ] Write tests for labels, symbols, valid transitions, invalid transitions, and priority independence.
- [ ] Implement the smallest pure functions required by the tests.
- [ ] Run `npm test -- src/domains/learning/tasks/state.test.ts`.
- [ ] Run `npm run typecheck`.

---

### Task 2: Build the accessible task-state presentation component

**Files:**
- Create: `src/components/learning/TaskStateBadge.tsx`
- Create: `src/components/learning/TaskStateBadge.test.tsx`

**Interfaces:**
- `TaskStateBadgeProps` accepts `status`, optional `priority`, and optional `className`.
- The component renders the Portuguese status label and stable symbol.
- Priority is visually secondary and never changes the status semantics.

- [ ] Write tests for every status, accessible name, symbol presence, priority rendering, and absence of theme-specific color literals.
- [ ] Implement the component using semantic token classes already provided by the design system.
- [ ] Respect reduced-motion behavior by using no required animation.
- [ ] Run `npm test -- src/components/learning/TaskStateBadge.test.tsx`.
- [ ] Run `npm run lint && npm run typecheck`.

---

### Task 3: Document the feature contract

**Files:**
- Create: `docs/architecture/learning-task-states.md`

Document objective, user, flow, states, empty/loading/error/success behavior for future task collections, accessibility, authorization boundary, testing contract, and explicitly deferred persistence/scheduling/gamification.

- [ ] Verify the documentation matches the implemented TypeScript contracts.
- [ ] Run the full quality gate: `npm run typecheck && npm run lint && npm test && npm run build`.
