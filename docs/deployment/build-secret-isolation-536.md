# P0 #536 — Fail-closed credential boundary for Git-backed builds

**PROPOSED, nonproductive, unmerged / NO-GO.** Technical safeguard only: this does not prove Render build/runtime isolation or authorize any migration, merge, secrets changes, image publication or deployment.

## Provenance
- Base: PR #592 / `c89b2b8fcc7940d9f0282f7e5f918d5cdb7d04f4`.
- Purpose: the current Git-backed Render build shares service environment with runtime and invokes dependency install and Next compilation. The old lifecycle-script checks do not establish that credential-bearing environment is absent.
- The `scripts/security/assert-build-secret-isolation-536.cjs` script refuses nonempty credential-style variables before `npm ci` in `render.yaml`, and also in npm `prebuild`. Public browser config is narrowly exempted by explicit name. Any unrecognized credential variable matching the policy fails closed.
- Synthetic-only `node:test` cases exercise OPENAI/PARALLEL/EXA, OAuth client secret, database, Supabase service-role, registry and deploy-hook names, and assert that the failure never prints canary values.
- The new PR-scoped GitHub Actions job has read-only permissions, no hosted secrets, no docker push or deploy, and pins the exact PR head.

## Limitations and release prohibition
1. This is a **detection guard, not secret isolation**. The Render Git build process still can receive runtime variables **before** this program runs; a compromised build platform/runtime could bypass the check. Build tools can also use unexpected names not matched by the pattern.
2. Installing this guard without separating existing runtime-only variables could deliberately fail the next Render build. **Do not merge or deploy this proposal until a change window and runtime/build separation are independently approved.**
3. The canonical closure of #536 still requires an actual image-based or runtime-only-secret build boundary, negative proof without exposing real credential bytes, an immutable deployed revision, exact smoke, rollback and independent D1–D4 signoffs.
4. The source-tree `render.yaml` is modified in an **isolated PR only**; the live Render service, GitHub configuration, Secrets, billing and main branch remain untouched.
5. A green synthetic CI is only a test of code behavior. It does not establish Render Secret Files semantics, off-GHCR durability, privacy policy ratification or human authorization.

**Acceptance:** independent code review of current HEAD, success of new synthetic-negative CI, explicit evidence of no secrets in proposed build source, operational signoff and proof of hosted isolation before considering merge. Keep #536/#593/#594/#595 open.
