# Authorization Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the minimum server-enforced authorization foundation defined by the approved MASTER 05 specification without inventing product roles, permissions, resources, ownership models, or database schema.

**Architecture:** Keep authorization as a pure domain boundary in the modular monolith. The domain evaluates explicit policies with fail-closed default deny; application/server code is responsible for enforcing the decision before protected work executes; Supabase/RLS remains persistence-level defense in depth for future real product resources.

**Tech Stack:** Next.js App Router, TypeScript, React, Tailwind CSS, Supabase Auth/Database/RLS, Vitest, Testing Library, ESLint, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-01-authorization-foundation-design.md`

## Global Constraints

- The `authorization` domain must not directly depend on React, Next.js UI APIs, Supabase client APIs, or concrete infrastructure.
- Authorization defaults to deny when no applicable explicit policy authorizes an operation.
- Authenticated actor identity must come from server-side authentication/session state, never from client-supplied identity fields.
- Client-controlled `userId`, `ownerId`, `resourceId`, hidden fields, local storage, and URL parameters are untrusted input.
- Frontend visibility, redirects, `proxy.ts`, and route protection are not authorization boundaries by themselves.
- Do not create business roles, RBAC, enterprise IAM, product-specific permissions, speculative resources, speculative ownership relationships, speculative tables, speculative RLS policies, or authorization-specific migrations.
- Do not implement AI/Mestre Arcano or Flonts authorization behavior in this stage.
- Do not expose privileged credentials such as `service_role` through public environment variables or client bundles.
- Authorization errors must fail closed without revealing tokens, secrets, internal policy details, table names, RLS definitions, private resource existence, or other users' data.
- Follow TDD: write the failing test, run it, implement the smallest change, rerun focused tests, then run the relevant broader gate.

---

## File Map

**Existing files expected to be reviewed/modified:**
- `src/core/authorization/contracts.ts` — retain/refine the domain authorization vocabulary and explicit decision types without introducing product permissions.
- `src/core/authorization/contracts.test.ts` — replace shape-only coverage with behavioral contract coverage, especially default deny and controlled denial semantics.
- `src/core/architecture/domain-policy.ts` — only modify if required to keep the authorization domain declaration synchronized with the implementation; preserve its existing dependency restrictions.
- Existing application/server authentication and enforcement locations discovered during implementation — add the smallest integration point necessary to prevent protected server operations from bypassing authorization. Do not create routes or product resources solely for this stage.
- Existing security/architecture test locations discovered during implementation — extend only where needed to assert the authorization boundary.
- Existing documentation location(s) established by the repository for architecture/security guidance — document the approved authorization model and current limitations without duplicating unrelated docs.

**New files may be created only when the existing structure has no suitable location:**
- A focused domain guard/evaluator module under `src/core/authorization/`, with its test, if the current contracts file should remain type-only.
- A focused server/application enforcement adapter only if an existing application boundary cannot host the guard without violating layering.

**No database files, migrations, product tables, roles, or product policy registries are planned.**

---

### Task 1: Establish the behavioral authorization kernel

**Files:**
- Modify: `src/core/authorization/contracts.ts` or create one focused evaluator beside it, following the existing repository structure.
- Test: `src/core/authorization/contracts.test.ts` or a focused adjacent authorization test.

**Interfaces:**
- Consumes: the existing `AccessRequest`, `AccessDecision`, `AccessAction`, and `AuthorizationPolicy` vocabulary where compatible with the approved spec.
- Produces: one pure authorization evaluation entry point whose behavior is: an explicit allowing policy may return `allowed: true`; absence of an applicable policy returns a controlled `allowed: false`; evaluation has no React/Next/Supabase dependencies.

- [ ] **Step 1: Write failing tests for default deny and explicit allow.**

```ts
it("denies when no authorization policy is applicable", () => {
  const result = evaluateAuthorization(request, undefined);
  expect(result.allowed).toBe(false);
});

it("allows only when the supplied policy explicitly allows", () => {
  const policy = () => ({ allowed: true, scope: "self" as const });
  const result = evaluateAuthorization(request, policy);
  expect(result).toEqual({ allowed: true, scope: "self" });
});
```

- [ ] **Step 2: Run the focused authorization test and confirm the new behavior is not yet satisfied.**

Run the repository's existing focused Vitest command for the authorization test file (use the package script already defined by the repository rather than inventing a new test runner command).

Expected: the new test fails because the evaluator/default-deny behavior does not yet exist.

- [ ] **Step 3: Implement the smallest pure evaluator.**

The evaluator must:
1. accept the existing request type;
2. accept an optional explicit policy;
3. return a controlled deny when no policy is supplied;
4. invoke the supplied policy only when one is explicitly provided;
5. contain no imports from React, Next.js, Supabase, UI, or infrastructure.

- [ ] **Step 4: Run the focused authorization test and confirm it passes.**

Expected: all focused authorization tests pass with no unrelated test changes.

- [ ] **Step 5: Commit the kernel.**

```bash
git add src/core/authorization
git commit -m "feat: establish authorization default deny kernel"
```

---

### Task 2: Harden authorization failure behavior and client-input boundaries

**Files:**
- Modify: the focused authorization domain test(s) from Task 1.
- Modify: the smallest existing application/server boundary that receives authenticated actor/resource identifiers, only if a real protected operation exists in the current repository.
- Test: corresponding authorization/security test location.

**Interfaces:**
- Consumes: the Task 1 evaluator and the existing server authentication contract.
- Produces: tests proving that authorization is based on authoritative server identity and that client-controlled ownership/identity claims cannot turn into authorization.

- [ ] **Step 1: Add failing tests for untrusted client identity/ownership fields.**

```ts
it("does not treat a client-supplied owner id as authorization", () => {
  const result = evaluateAuthorization(
    { ...request, actorId: "server-actor" },
    undefined,
  );
  expect(result.allowed).toBe(false);
});

it("denies an incompatible context when the applicable policy rejects it", () => {
  const policy = () => ({ allowed: false, reason: "wrong-context" as const });
  expect(evaluateAuthorization(request, policy)).toEqual({
    allowed: false,
    reason: "wrong-context",
  });
});
```

If no real protected operation currently exists, keep this task domain-level and do not manufacture a product endpoint solely for the test.

- [ ] **Step 2: Run the focused security tests and confirm the new assertions fail where behavior is missing.**

Expected: failures identify only the missing authorization boundary behavior.

- [ ] **Step 3: Implement the minimal enforcement change.**

Where a real server operation exists, obtain the actor from the existing authenticated server session/claims path and invoke the authorization evaluator before the operation. Ignore client-provided identity/ownership claims as proof of permission.

If there is no real protected operation in the current product surface, do not add one; document the enforcement contract and leave integration readiness for the first real protected use case.

- [ ] **Step 4: Add failure-surface tests ensuring authorization errors expose only controlled information.**

```ts
it("does not expose implementation details in a denial", () => {
  const result = evaluateAuthorization(request, undefined);
  expect(result.allowed).toBe(false);
  expect(JSON.stringify(result)).not.toMatch(/token|secret|table|policy|stack/i);
});
```

- [ ] **Step 5: Run focused authorization/security tests and confirm they pass.**

Expected: focused tests pass and no sensitive implementation detail is part of the decision contract.

- [ ] **Step 6: Commit the enforcement/security behavior.**

```bash
git add src/core/authorization <only-the-existing-server-or-test-files-that-were-actually-changed>
git commit -m "feat: enforce authorization boundaries server-side"
```

---

### Task 3: Verify architecture, Supabase posture, and security boundaries

**Files:**
- Modify: `src/core/architecture/domain-policy.ts` only if an implementation change requires an accurate declaration.
- Modify: existing architecture/security tests only where required by the approved contract.
- Modify: existing security documentation only where needed to record the final implementation.
- Do not create migrations or database schema files.

**Interfaces:**
- Consumes: completed authorization kernel and any real server enforcement from Tasks 1–2.
- Produces: evidence that domain boundaries remain intact and Supabase remains prepared for future RLS without speculative schema.

- [ ] **Step 1: Add/adjust the architecture test that forbids authorization-domain imports of React, Next.js, Supabase client, UI, and concrete infrastructure.**

```ts
it("keeps authorization domain independent of framework and infrastructure", async () => {
  const violations = await scanAuthorizationImports();
  expect(violations).toEqual([]);
});
```

Use the repository's existing architecture-test helper instead of introducing a second scanner.

- [ ] **Step 2: Run the architecture test and confirm it passes.**

Expected: no forbidden imports or circular dependency violations.

- [ ] **Step 3: Inspect the existing Supabase migration/function/RLS posture without adding speculative product policy.**

Verify the existing migration that hardens RLS/execute behavior, current database tables, functions/RPCs, grants, and privileged credential handling. Record only findings supported by the actual repository/Supabase state.

- [ ] **Step 4: Run secret/environment checks.**

Verify no `service_role` or other privileged credential is exposed through `NEXT_PUBLIC_*`, frontend source, committed environment files, or client bundles. Use the repository's existing Gitleaks/security commands.

- [ ] **Step 5: Update the relevant documentation with the final authorization boundary.**

Document identity vs authentication vs authorization, default deny, server enforcement, ownership validation, context, RLS defense in depth, `proxy.ts` limitations, current absence of product resources, and future extension constraints.

- [ ] **Step 6: Run focused architecture/security tests.**

Expected: authorization tests, architecture tests, and security checks pass.

- [ ] **Step 7: Commit the verification/documentation changes.**

```bash
git add src/core docs
 git commit -m "docs: document authorization security boundary"
```

---

### Task 4: Run the complete MASTER 05 Quality Gate

**Files:**
- No planned source changes; only fix regressions discovered by verification, and if a fix is required, return to the smallest preceding task and commit it there before rerunning this gate.

**Interfaces:**
- Consumes: all completed implementation and documentation changes.
- Produces: reproducible evidence for every MASTER 05 acceptance criterion.

- [ ] **Step 1: Inspect Git state and diff.**

Run:

```bash
git status --short
git diff --check
git diff --stat
```

Expected: only intended MASTER 05 files are changed; no speculative schema or unrelated UI changes are present.

- [ ] **Step 2: Run typecheck.**

Use the repository's existing package script.

Expected: zero TypeScript errors.

- [ ] **Step 3: Run lint.**

Use the repository's existing package script.

Expected: zero lint errors and no newly introduced warnings that violate the project's gate.

- [ ] **Step 4: Run unit and authorization/security tests.**

Use the repository's existing test scripts and focused authorization/security tests.

Expected: all tests pass.

- [ ] **Step 5: Run architecture tests.**

Use the repository's existing architecture-test command.

Expected: dependency direction and authorization domain restrictions remain green.

- [ ] **Step 6: Run accessibility smoke and production build.**

Use the repository's existing accessibility smoke and build scripts.

Expected: accessibility smoke passes and production build completes successfully.

- [ ] **Step 7: Run Gitleaks and environment/secret review.**

Use the repository's existing Gitleaks command and inspect environment exposure.

Expected: no leaked secrets and no privileged client exposure.

- [ ] **Step 8: Recheck Supabase security/RLS posture.**

Confirm the database remains healthy, no product schema was invented, existing security findings remain clean, and any relevant functions/grants were reviewed.

Expected: no unresolved Master 05 security blocker.

- [ ] **Step 9: Verify CI workflow compatibility.**

Inspect `.github/workflows/quality-gate.yml` and, where available, verify the corresponding workflow status for the implementation commit.

Expected: local gates match CI expectations.

- [ ] **Step 10: Produce the MASTER 05 final report without merging or advancing the project.**

The report must use the required headings and explicitly state current branch/commit, audit findings, changes, authorization/ownership/enforcement, Supabase/RLS/security, tests, Quality Gate, Git/PR, remaining risks, new ideas, user action, and the required next step: return to the Orchestrator for MASTER 06 — Design System.

---

## Final Acceptance Checklist

- [ ] Default deny is implemented and tested.
- [ ] Explicit allow requires an applicable policy.
- [ ] Authorization domain remains framework/infrastructure independent.
- [ ] Server-side authenticated identity is authoritative.
- [ ] Client-controlled identity/ownership cannot grant access.
- [ ] Horizontal/vertical escalation principles are tested to the extent supported by the current resource model.
- [ ] No speculative roles, permissions, resources, ownership models, tables, RLS policies, or migrations were introduced.
- [ ] Privileged Supabase credentials remain backend-only.
- [ ] Authorization failures fail closed without sensitive information leakage.
- [ ] Complete MASTER 05 Quality Gate is green.
- [ ] Documentation accurately states guarantees and current limitations.
- [ ] No merge or MASTER 06 transition is performed by this stage.
