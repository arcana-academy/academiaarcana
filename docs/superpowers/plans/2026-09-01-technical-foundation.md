# Academia Arcana Technical Foundation Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the non-visual technical foundation of Academia Arcana without introducing premature product behavior or microservices.

**Architecture:** Preserve the approved modular monolith. Keep domain contracts and dependency rules independent from React and infrastructure; expose infrastructure through typed ports; keep environment parsing, error normalization, and observability centralized; enforce the architecture in tests and CI.

**Tech Stack:** Next.js App Router, TypeScript strict mode, ESLint 9, Vitest, Testing Library, Node 22, npm, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-31-academia-arcana-architecture-design.md`

## Global Constraints

- Do not introduce microservices.
- Do not put database access, authorization, or business rules inside visual components.
- Keep the 13 approved domains explicit: identity, context, authorization, learning, planning, gamification, education, social, adaptive, intelligence, flonts, trust, data.
- Domain data ownership remains local to each domain.
- Cross-domain access uses typed contracts rather than direct UI-to-table access.
- Flonts remains presentation/runtime only and never becomes a data-access shortcut.
- The Master Arcane is not an unrestricted database client.
- Server-side authorization and database RLS remain required before protected persistence is introduced.
- Do not mark a quality gate green without executable evidence.

---

### Task 1: Enforce the domain registry and module boundaries

**Files:**
- Create: `src/domains/identity/index.ts`
- Create: `src/domains/context/index.ts`
- Create: `src/domains/authorization/index.ts`
- Create: `src/domains/learning/index.ts`
- Create: `src/domains/planning/index.ts`
- Create: `src/domains/gamification/index.ts`
- Create: `src/domains/education/index.ts`
- Create: `src/domains/social/index.ts`
- Create: `src/domains/adaptive/index.ts`
- Create: `src/domains/intelligence/index.ts`
- Create: `src/domains/flonts/index.ts`
- Create: `src/domains/trust/index.ts`
- Create: `src/domains/data/index.ts`
- Create: `src/domains/index.ts`
- Create: `src/core/architecture/dependencies.ts`
- Test: `src/core/architecture/dependencies.test.ts`

**Interfaces:**
- `DomainModule` exposes only the domain identifier and a public contract marker.
- `DOMAIN_DEPENDENCIES` maps every domain to an explicit readonly list of allowed domain dependencies.
- No domain depends on itself.
- The dependency graph must be acyclic.

- [ ] **Step 1: Write the failing architecture test**

```ts
import { describe, expect, it } from "vitest";
import { CORE_DOMAINS } from "./domains";
import { DOMAIN_DEPENDENCIES, assertAcyclicDomainGraph } from "./dependencies";

describe("domain dependency architecture", () => {
  it("registers exactly the approved domains with no cycles", () => {
    expect(Object.keys(DOMAIN_DEPENDENCIES).sort()).toEqual([...CORE_DOMAINS].sort());
    expect(() => assertAcyclicDomainGraph(DOMAIN_DEPENDENCIES)).not.toThrow();
    for (const domain of CORE_DOMAINS) {
      expect(DOMAIN_DEPENDENCIES[domain]).not.toContain(domain);
    }
  });
});
```

- [ ] **Step 2: Run the test and verify it fails for the missing dependency contract**

Run: `npm test -- src/core/architecture/dependencies.test.ts`
Expected: FAIL because `dependencies.ts` does not exist yet.

- [ ] **Step 3: Implement the minimal dependency registry**

Define a typed graph using `CoreDomain` and choose a one-direction foundation graph: `identity -> context -> authorization`; domain modules may depend on shared core contracts, while product domains depend only on the contracts they explicitly need. Keep the initial public domain entrypoints intentionally empty of product behavior.

- [ ] **Step 4: Add cycle detection**

Implement `assertAcyclicDomainGraph(graph)` with depth-first traversal. Throw a deterministic `Error` containing the cycle path when a cycle is found.

- [ ] **Step 5: Run the focused test**

Run: `npm test -- src/core/architecture/dependencies.test.ts`
Expected: PASS.

- [ ] **Step 6: Run typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS with zero errors.

- [ ] **Step 7: Commit**

```bash
git add src/domains src/core/architecture/dependencies.ts src/core/architecture/dependencies.test.ts
git commit -m "feat: enforce domain module boundaries"
```

---

### Task 2: Add typed error and Result infrastructure

**Files:**
- Create: `src/core/errors/errors.ts`
- Create: `src/core/errors/result.ts`
- Create: `src/core/errors/index.ts`
- Test: `src/core/errors/result.test.ts`

**Interfaces:**
- `AppError` contains `code`, `message`, `kind`, and optional `cause`.
- `Result<T, E = AppError>` is `{ ok: true; value: T } | { ok: false; error: E }`.
- `ok(value)` and `err(error)` construct the two variants.
- Error codes are stable machine-readable identifiers; user-facing copy is not stored as an authorization decision.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";
import { err, ok } from "./result";

describe("Result", () => {
  it("represents success without throwing", () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 });
  });

  it("represents failure with a typed application error", () => {
    const error = { code: "NOT_FOUND", kind: "not-found" as const, message: "Missing resource" };
    expect(err(error)).toEqual({ ok: false, error });
  });
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- src/core/errors/result.test.ts`
Expected: FAIL because the error/result modules do not exist.

- [ ] **Step 3: Implement minimal types and constructors**

Implement the discriminated union and constructors with no framework dependency.

- [ ] **Step 4: Run the focused test**

Run: `npm test -- src/core/errors/result.test.ts`
Expected: PASS.

- [ ] **Step 5: Run typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/core/errors
git commit -m "feat: add typed application error foundation"
```

---

### Task 3: Establish environment validation and server/client boundaries

**Files:**
- Create: `src/lib/env.ts`
- Create: `src/lib/env.test.ts`
- Modify: `.env.example`
- Modify: `package.json`

**Interfaces:**
- `serverEnv` exposes only server-side variables.
- `publicEnv` exposes only `NEXT_PUBLIC_*` variables.
- Missing required server configuration fails deterministically with a typed configuration error.
- No secret value is logged or exposed through `publicEnv`.

- [ ] **Step 1: Write the failing environment tests**

Test that public configuration contains no server secret keys and that missing required configuration is rejected with a stable error code.

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- src/lib/env.test.ts`
Expected: FAIL because the environment module does not exist.

- [ ] **Step 3: Implement the smallest validation layer**

Use explicit variable names and `process.env` access in one module. Keep Supabase variables as optional foundation placeholders until the authentication/RLS implementation plan; never silently fall back to fake credentials.

- [ ] **Step 4: Add environment script contract**

Ensure package scripts do not require a production secret for ordinary typecheck/lint/test execution. Keep `.env.example` free of real values.

- [ ] **Step 5: Run tests, typecheck, and lint**

Run: `npm test -- src/lib/env.test.ts && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/env.ts src/lib/env.test.ts .env.example package.json
 git commit -m "feat: centralize environment configuration"
```

---

### Task 4: Add framework-independent observability and error normalization

**Files:**
- Create: `src/core/observability/logger.ts`
- Create: `src/core/observability/index.ts`
- Create: `src/core/observability/logger.test.ts`
- Create: `src/app/error.tsx`
- Create: `src/app/global-error.tsx`

**Interfaces:**
- `Logger` exposes `debug`, `info`, `warn`, and `error` methods with structured metadata.
- Logging strips secrets from known fields and never logs authorization tokens, cookies, passwords, or environment values wholesale.
- Production logging defaults to concise structured events; development may retain readable output.

- [ ] **Step 1: Write the failing logger tests**

Test that structured metadata is emitted and secret-shaped fields are redacted.

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- src/core/observability/logger.test.ts`
Expected: FAIL because the logger does not exist.

- [ ] **Step 3: Implement the minimal logger adapter**

Keep the interface independent from any vendor. Use `console` only behind the adapter. Redaction must be deterministic and shallow for the initial foundation.

- [ ] **Step 4: Add App Router error boundaries**

Provide accessible recovery UI and log unexpected errors through the logger without rendering stack traces or secret-bearing details to users.

- [ ] **Step 5: Run tests and static checks**

Run: `npm test -- src/core/observability/logger.test.ts && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/core/observability src/app/error.tsx src/app/global-error.tsx
git commit -m "feat: add safe observability and error boundaries"
```

---

### Task 5: Harden dependency management and CI consistency

**Files:**
- Modify: `.nvmrc`
- Modify: `.github/workflows/quality.yml`
- Modify: `.github/dependabot.yml`
- Modify: `package.json`
- Test: `src/core/architecture/tooling.test.ts`

**Interfaces:**
- Local and CI runtime use Node 22, matching `.nvmrc`.
- CI runs typecheck, lint, unit tests, and production build.
- Dependabot remains enabled for npm dependencies.
- Tooling expectations are asserted by a lightweight architecture test so accidental drift is visible.

- [ ] **Step 1: Write the failing tooling contract test**

Assert that the package exposes `typecheck`, `lint`, `test`, and `build`, and that the repository runtime declaration is Node 22.

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- src/core/architecture/tooling.test.ts`
Expected: FAIL if the current tooling contract does not match the test.

- [ ] **Step 3: Align CI with `.nvmrc`**

Change the quality workflow from Node 24 to Node 22 and keep the existing npm installation strategy. Do not switch package managers during this foundation slice.

- [ ] **Step 4: Add package engine declaration**

Declare Node 22 compatibility in `package.json` without introducing an unsupported dependency constraint.

- [ ] **Step 5: Run focused test and checks**

Run: `npm test -- src/core/architecture/tooling.test.ts && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add .nvmrc .github/workflows/quality.yml .github/dependabot.yml package.json src/core/architecture/tooling.test.ts
git commit -m "chore: align foundation tooling and CI"
```

---

### Task 6: Final quality gate and architecture review

**Files:**
- Review all files changed by Tasks 1–5
- Modify only if a verification failure requires a targeted fix

- [ ] **Step 1: Run the complete quality gate**

Run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: all commands exit successfully with zero TypeScript errors, zero lint errors, zero test failures, and a successful production build.

- [ ] **Step 2: Review imports and dependency direction**

Confirm UI imports contracts/services rather than infrastructure; no component imports Supabase clients; no authorization implementation is embedded in visual components; no domain imports a sibling's internal file; no cycle exists in `DOMAIN_DEPENDENCIES`.

- [ ] **Step 3: Review the diff**

Inspect the final branch diff against `main`. Remove unrelated changes and reject any future-feature implementation that slipped into the foundation.

- [ ] **Step 4: Record evidence**

Only after executable evidence is available, update the implementation ledger/status documentation with the exact commands and outcomes. Never mark a gate green based only on source inspection.

- [ ] **Step 5: Commit the verified foundation**

```bash
git add docs/superpowers/plans/2026-09-01-technical-foundation.md
 git commit -m "docs: record technical foundation hardening plan"
```
