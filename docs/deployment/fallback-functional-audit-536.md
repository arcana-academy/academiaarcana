# P0 #536 — historical LIVE fallback functional and auth/RLS isolation audit

Date: 2026-10-09. **State: verification underway / NO-GO for production release.** Branch-only documentation and testing.

## Immutable evidence contract

Historical LIVE source: `17fb81477fbd3eed14b93103641004a766eb9ac1`, pinned independently in `.github/workflows/fallback-historical-rls-536.yml`. Reviewed Docker recipe: `cc17653dfe79c44dd83ba1ced8cb065383b11ca9`. Draft review PR #585 is not the historical source; it only carries the validation workflow and this report.

This workflow reconstructs the **24 historical SQL migration files** in a disposable GitHub Actions Supabase DB via `supabase db start` and `supabase migration up --local --include-all`. It runs the **11 historical pgTAP SQL tests** from the exact pinned old checkout, including P0 auth/RLS inter-user, ownership and grants; gamification atomicity; page movements; social and focus access; feedback grants; encrypted integration credentials; external document source access; educational core privileges/RLS; and objective-evidence privilege/RLS/RPC tests. Each test targets explicit `127.0.0.1:54322`, not any hosted Supabase endpoint, and is within a disposable runner. Workflow has `contents: read` only, no `secrets.*`, image publishing, registry upload, Render API, admin tokens or `supabase db reset --linked`. Every database test is sourced from the immutable `17fb814` checkout.

**Do not claim the workflow has passed until the action run on the exact latest PR HEAD is green.** Existing fallback build/isolated smoke and JS unit tests are separate evidence, not substituted for real multi-service integration.

## Read-only production metadata confrontation

- Current connected Supabase public schema: **15 tables**, all RLS-enabled, **49 policies**, no `anon SELECT` table grants.
- **Four public application RPCs**: `complete_study_task_with_reward`, `move_workspace_page`, `record_educational_practice_attempt`, `record_criterion_referenced_practice_attempt`; each `SECURITY INVOKER`, has `authenticated EXECUTE` and lacks `anon EXECUTE` in production. A private-schema `SECURITY DEFINER` implementation exists for the criterion attempt and must retain schema isolation and explicit caller checks. Grants and introspection do not prove row-level runtime behavior.
- 26 production migration registry records vs 24 historical versioned SQL migrations. The educational `20261002190600` ledger row has **NULL statements**; read-only checks nevertheless found all 10 targeted P1.5 evidence columns, 7 evidence/criterion checks, a protection trigger, and public/private criterion RPC functions. These facts are partial structural evidence, not full statement equivalence. The live `feedback_responses.user_id` FK is **SET NULL** despite NOT NULL and differs from versioned **CASCADE**, and must not be silently masked by version repair.
- A confirmed user-side manual Render Environment comparison matched the current production-public Supabase URL and publishable key to the active project. **Historical Next.js build-time bundle parity** was not independently proven. This does not authorize publish, deploy, source switch or variable changes.

## Acceptance matrix

| Gate | Evidence needed | Current classification |
|---|---|---|
| Historic source+package provenance | Source pin, reviewed recipe and prior smoke | PASSED in earlier sandbox CI; rerun if HEAD changes |
| Historical migration reconstruct | 24 migrations applied only to disposable database | PENDING new workflow |
| Historical auth/RLS behavioral tests | 11 historical pgTAP files all passing | PENDING new workflow |
| Live public schema and RPC mapping | Read-only object/grant/policy query | PASS metadata only |
| P1.5 missing SQL | Exact SQL reconstruction and signature/trigger behavior comparison | PARTIAL; one ledger has NULL statements |
| Feedback account deletion contract | Product/privacy retention decision, safe forward migration simulation | NO-GO: live FK differs |
| Auth cookies, SSO/login, RLS inter-account via HTTP, Storage | Authenticated nonproduction end-to-end sessions and audit logs | NOT TESTED for historical image |
| Historical deployed JS public configuration | Independent provenance evidence vs current Render env | NOT PROVEN |
| Image backup and recovery | Second published immutable manifest digest, independent backup/restore drill | NOT AUTHORIZED / NOT CREATED |
| Production cutover/rollback | Explicit human approval and independent review | NO-GO |

**Interpretation:** A green isolated workflow proves the *source migrations and pgTAP source tests run together* under the pinned CLI; it does NOT prove exact equivalence to the remotely applied migration history, real identity-provider flows, actual historical Render secret/config injection, independently retrievable OCI layers or rollback readiness.

## Next governed phase

Only after this workflow is green: independently review the Feedback data retention choice A/B/C, replay the full remote-applied migration history in a **separate sterile, reviewed sandbox** (including a supported reconstruction of the missing SQL record), compare catalog fingerprints, and conduct a historical fallback image login/RLS/Storage session test against a nonproduction Supabase project. All such external operations require separate scope/authorization. Do not replay any migration on production. Preserve #536 OPEN, PR #585 DRAFT, auto-deploy OFF.
