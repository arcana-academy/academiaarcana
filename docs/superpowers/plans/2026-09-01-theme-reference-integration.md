# Theme Reference Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend Academia Arcana's existing theme system with a governed, reference-derived visual vocabulary without importing third-party theme CSS or creating parallel styling systems.

**Architecture:** Reuse `src/design-system/themes` and `src/design-system/tokens` as the single source of truth. Preserve existing theme IDs and behavior, add only reusable semantic token dimensions, and introduce reference-inspired presets incrementally. References remain research inputs rather than runtime dependencies.

**Tech Stack:** Next.js, TypeScript, React, Tailwind CSS, existing Arcana theme engine, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-01-theme-reference-integration-design.md`

## Global Constraints

- Preserve the modular monolith.
- Preserve existing theme IDs and compatibility.
- No pure white UI backgrounds or pure white text.
- WCAG 2.2 AA remains the minimum.
- Reduced motion must remain supported.
- No third-party Obsidian theme runtime dependency.
- Do not copy vendor CSS wholesale.
- Do not alter authorization, persistence, or domain contracts.
- Keep theme configuration centralized.
- Prefer additive migration.

---

### Task 1: Baseline theme contract and regression tests

**Files:**
- Modify: `src/design-system/tokens/types.ts`
- Modify: `src/design-system/themes/presets.test.ts`
- Modify: `src/design-system/themes/theme-context.test.tsx`

**Interfaces:**
- Consumes: existing `ThemeId`, `ThemeTokens`, `ThemePreset`, `themePresets`.
- Produces: regression guarantees that existing themes remain complete and valid while the contract evolves.

- [ ] **Step 1: Write failing tests**

Add tests that assert every registered theme has every required token group and that no theme token contains pure white (`#fff`, `#ffffff`, case-insensitive) for UI surfaces or text.

- [ ] **Step 2: Run tests and verify the new assertions expose current gaps**

Run: `npm test -- --run src/design-system/themes/presets.test.ts`
Expected: the new assertions fail only where the current contract does not yet satisfy the intended invariant.

- [ ] **Step 3: Make the smallest contract-compatible change**

Extend the token types only for shared dimensions required by at least two reference-derived themes. Do not add one-off tokens.

- [ ] **Step 4: Run the focused tests**

Run: `npm test -- --run src/design-system/themes/presets.test.ts src/design-system/themes/theme-context.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/design-system/tokens/types.ts src/design-system/themes/presets.test.ts src/design-system/themes/theme-context.test.tsx
git commit -m "test: strengthen theme contract invariants"
```

---

### Task 2: Add reusable reference-derived visual tokens

**Files:**
- Modify: `src/design-system/tokens/types.ts`
- Modify: `src/design-system/tokens/base.ts`
- Modify: `src/design-system/themes/presets.ts`
- Modify: `src/design-system/themes/presets.test.ts`

**Interfaces:**
- Consumes: existing `ThemeTokens` and `createPreset` merge behavior.
- Produces: backward-compatible semantic tokens for density, radius/shadow profiles, typography roles, and focus treatment only where reusable.

- [ ] **Step 1: Write failing tests**

Test that every preset receives the new shared dimensions and that the base theme supplies safe defaults for all of them.

- [ ] **Step 2: Run focused tests**

Run: `npm test -- --run src/design-system/themes/presets.test.ts`
Expected: FAIL because the new dimensions do not yet exist.

- [ ] **Step 3: Implement minimal token extensions**

Add typed defaults to `baseTokens` and preserve the existing deep-merge strategy in `createPreset`. Keep names semantic rather than referencing Obsidian-specific concepts.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- --run src/design-system/themes/presets.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/design-system/tokens/types.ts src/design-system/tokens/base.ts src/design-system/themes/presets.ts src/design-system/themes/presets.test.ts
git commit -m "feat: extend semantic theme tokens"
```

---

### Task 3: Introduce the first reference-derived theme batch

**Files:**
- Modify: `src/design-system/tokens/types.ts`
- Modify: `src/design-system/themes/presets.ts`
- Modify: `src/design-system/themes/presets.test.ts`

**Interfaces:**
- Consumes: semantic theme contract from Tasks 1–2.
- Produces: new Arcana-owned presets inspired by the supplied visual references, without importing their CSS or runtime code.

- [ ] **Step 1: Write failing tests**

Add explicit tests for the new preset IDs, names, token completeness, valid contrast relationships where testable from the token model, and prohibition of pure-white surfaces/text.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- --run src/design-system/themes/presets.test.ts`
Expected: FAIL because the new preset IDs are absent.

- [ ] **Step 3: Add the preset IDs and values**

Create a curated batch rather than one preset per repository. Group visually redundant references into coherent Arcana themes. Preserve the existing ten IDs and add new IDs only for materially distinct visual systems.

- [ ] **Step 4: Validate the theme registry**

Run: `npm test -- --run src/design-system/themes/presets.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/design-system/tokens/types.ts src/design-system/themes/presets.ts src/design-system/themes/presets.test.ts
git commit -m "feat: add reference-derived theme presets"
```

---

### Task 4: Validate theme application and accessibility behavior

**Files:**
- Modify: `src/design-system/themes/theme-context.test.tsx`
- Modify: `src/design-system/themes/apply-theme.ts` only if tests identify a real integration gap.

**Interfaces:**
- Consumes: expanded `ThemePreset` records.
- Produces: verified runtime theme switching with preserved reduced-motion and focus behavior.

- [ ] **Step 1: Add integration tests**

Test switching from an existing theme to a new preset and back, persistence of the selected theme through the existing context mechanism, and application of all new semantic variables.

- [ ] **Step 2: Run focused integration tests**

Run: `npm test -- --run src/design-system/themes/theme-context.test.tsx`
Expected: FAIL only for missing application of newly introduced tokens.

- [ ] **Step 3: Update theme application minimally**

Map each new semantic token to the existing CSS-variable/application mechanism. Do not introduce a second theme provider.

- [ ] **Step 4: Run integration tests**

Run: `npm test -- --run src/design-system/themes/theme-context.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/design-system/themes/theme-context.test.tsx src/design-system/themes/apply-theme.ts
git commit -m "feat: apply expanded theme tokens"
```

---

### Task 5: Full design-system regression and quality gate

**Files:**
- Modify: only files identified by failing tests.
- Test: existing theme test suite plus project-wide checks.

**Interfaces:**
- Consumes: completed theme-token and preset implementation.
- Produces: evidence that existing themes and the new reference-derived themes coexist without regressions.

- [ ] **Step 1: Run all design-system tests**

Run: `npm test -- --run src/design-system`
Expected: PASS.

- [ ] **Step 2: Run TypeScript validation**

Run: `npx tsc --noEmit`
Expected: PASS with no new type errors.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 4: Inspect the final diff for prohibited coupling**

Verify no Obsidian theme repository is added as a runtime dependency, no vendor CSS is copied wholesale, and no application domain outside the design system was changed without a documented reason.

- [ ] **Step 5: Commit verification fixes if necessary**

```bash
git status
git diff --check
```
Expected: clean whitespace check and only intentional files changed.

- [ ] **Step 6: Record the implementation result**

Update the architecture/ADR documentation with the final preset inventory, any intentionally rejected references, and the validation evidence.

- [ ] **Step 7: Commit documentation**

```bash
git add docs/superpowers/specs/2026-09-01-theme-reference-integration-design.md docs/superpowers/plans/2026-09-01-theme-reference-integration.md
git commit -m "docs: record theme architecture decision"
```
