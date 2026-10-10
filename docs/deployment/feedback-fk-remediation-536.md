# P0 #536 — Feedback ownership FK: remediation decision and isolated validation

**Status (2026-10-09): PROPOSAL / NOT APPROVED FOR PRODUCTION DDL.**

## Executive finding (read-only evidence)

The versioned SQL file `supabase/migrations/20260929202000_feedback_hub.sql` describes `public.feedback_responses.user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`. The live connected Supabase catalog instead has FK `feedback_responses_user_id_fkey ON DELETE SET NULL` while `user_id` is still `NOT NULL`. The DB is **not identical to the versioned DDL**. Existing authenticated SELECT/INSERT policies in the live DB use `user_id = auth.uid()`, and no direct UPDATE/DELETE grant is made to ordinary authenticated users. The concrete FK conflict can block deletion of a user who has feedback; **no such real user deletion was attempted**, and the number of affected users/rows is not known.

This is a data-retention / product policy decision, not merely a migration-number typo. **Do not apply a schema change without a recorded retention decision and separate authorization.**

## Product, privacy and data-retention decision to ratify

### A. Delete with user — preferred technical alignment with the existing repository

`ON DELETE CASCADE` + `user_id NOT NULL` means that, when `auth.users` deletes a user, related feedback entries are deleted in the same transaction. This preserves the versioned source contract and avoids orphaned records. However, deleting feedback may remove investigation/audit evidence: product owner and legal/privacy reviewer must confirm any retention obligation, outstanding support case or deletion policy *before* authorizing it.

No inference is made that all feedback is disposable, nor that regulatory obligations require one particular action.

### B. Retain as anonymous feedback — alternative requiring a separate design

If feedback must outlive account deletion, allow `user_id NULL` and `ON DELETE SET NULL` **only after** revising RLS visibility, public API contracts, `createFeedback` return types, internal authorized moderation retention/deletion pathways and purge deadlines. Do **not** simply drop the NOT NULL constraint while leaving all ownership-based RLS policies unchanged: previously owned feedback may become invisible to user roles and may become unmanaged retained personal data (`email`, `name`, `feedback`). These fields still contain potentially identifiable content and must be subject to retention, purpose limitation and authorized review.

### C. Block account deletion until a supported administrative archival process

A deliberate `RESTRICT/NO ACTION` policy can protect evidence but needs an explicit user-facing workflow, data-subject rights procedures and operational ownership. **Not recommended as a silent consequence of the contradictory live FK.**

**Default technical proposal pending product/legal sign-off: A, with explicit retention decision.** Formal review request: [Trust/Privacy issue #588](https://github.com/arcana-academy/academiaarcana/issues/588). The approved general SEC-007 lifecycle rule calls for purpose-specific exceptions, backup/copy handling and controlled deletion; its narrowly defined allowance for minimum audit evidence is NOT authorization to retain all feedback content or to bypass legally required case holds.

## Guarded remediation design — SQL illustration ONLY, never executed or committed as a migration

If the approved decision is A, a reviewed migration would change only the existing FK action, preserving the `NOT NULL` column, existing RLS and direct privileges:

```sql
-- NOT EXECUTED. Do not run on production without explicit authorization.
begin;
alter table public.feedback_responses
  drop constraint feedback_responses_user_id_fkey;
alter table public.feedback_responses
  add constraint feedback_responses_user_id_fkey
  foreign key (user_id) references auth.users(id)
  on delete cascade;
commit;
```

Preconditions: inspect dependent constraints, owner role, current FK validation state and deletion blast radius **using metadata only**; confirm an authorized database backup/recovery point; review operational lock time on table and account-deletion behavior; change management review; DDL staging replay and tests. The DDL intentionally has no `DELETE`, `TRUNCATE`, `DROP TABLE`, policy relaxation, admin token, or `migration repair`. Do not touch the original historical migration; use a new reviewed forward migration **only after ratification**, generated through `supabase migration new` per current CLI guidance. Avoid using `supabase migration repair` to disguise source-vs-live differences.

Rollback is **not** simply restoring the contradictory `SET NULL + NOT NULL` FK. If a new action must be reverted, require another reviewed forward migration and data compatibility checks. For data deleted by `CASCADE`, rollback of DDL cannot restore deleted rows — recovery depends on the approved database backup/restore procedure.

## Regression matrix and actual isolated test

**Local-only regression:** `supabase/tests/database/feedback_fk_cascade_p0.test.sql` runs **17 pgTAP assertions** inside `BEGIN; ... ROLLBACK;` in the disposable GitHub Actions Supabase instance:

1. **8 original checks**: FK `CASCADE`, non-null owner, RLS, denied direct DELETE for authenticated, and correct synthetic A/B lifecycle without removing unrelated records.
2. **4 hosted-FK reproduction checks**: temporarily set `ON DELETE SET NULL` while owner stays NOT NULL; synthetic C deletion is rejected with SQLSTATE 23502 and C/feedback remain unchanged.
3. **5 hypothetical forward-repair checks**: restore `ON DELETE CASCADE` in the same disposable transaction; verify a validated FK, no widening of direct DELETE privilege, C deletion succeeds and cascades C feedback only, synthetic D feedback remains intact.

This validates a **hypothetical technical repair** in local versioned schema, not a ratified deletion/retention policy, migration file for production, remote migration-ledger replay or operational recovery proof.

**Important scope:** the test is added only to the **existing ephemeral Database Tests GitHub Actions job**. Its setup already runs `supabase db start` and `supabase migration up --local --include-all`, reconstructing the tracked local migration stack before executing pgTAP. The new test must not use `--linked`, `--db-url` aimed at Supabase Cloud or credentials from production. It tests the versioned local DDL **not** the currently contradictory live FK. No production changes.

**Gate:** CI must show Database Tests SUCCESS on the exact new HEAD, with an audit that no external data was read or modified. If test fails, record the failure, not a green status.

## Reconstruction / drift validation stages

**Stage 1 (this cycle):** reconstruct all 24 current versioned migrations in GitHub Actions' disposable local Supabase from scratch, then run the new FK regression test and previously existing auth/RLS, social, education and Feedback tests. `supabase stop` in an `if: always()` teardown ensures cleanup.

**Stage 2 (future separately authorized isolated test):** in a clean second local database, replay the **26 remote-applied SQL migrations** from the read-only ledger in exact applied order, after security review to exclude data, credentials or environment-specific side effects, and compare schema catalog fingerprints vs Stage 1. A record `20261002190600_p1_5_objective_evidence_v1` has no SQL stored, so *the remote rebuild cannot be declared complete from ledger alone*. Source migration timestamps also diverge, meaning a naïve supabase-cli migrate/replay or history repair is not safe. Do not present Stage 1 success as proving Stage 2 equivalence.

**Stage 3 (partially rehearsed only, without policy ratification):** the branch-only pgTAP now simulates the observed `SET NULL + NOT NULL` failure and a forward change to `CASCADE` using synthetic users inside a disposable transaction. A *real new migration file*, rehearsal against a faithful reviewed 26-migration environment, hold/exception handling, backup restoration and production change management remain **future separately authorized** steps. The local test is not permission to change the remote FK.

## Render Free public config parity — separate dependency

GitHub Actions public `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` previously matched the active Supabase API endpoint and named `academia_arcana_web` publishable key. The Render connector provides no read-only environment-variable endpoint. To compare *live Render* with the build, use an owner-authorized account session and compare the *same two public values* directly against active Supabase values, emitting only boolean matches, key name and `disabled=false`; never log the complete publishable key. For optional `NEXT_PUBLIC_HONEYBADGER_API_KEY` or assets URL, compare presence and formatting without copying values. **Do not read or modify private Render environment variables.**

If login cannot be completed, record **UNVERIFIED** and retain NO-GO. A configuration set in Render now may not equal the public values compiled into the historical live build; treat runtime settings and historical build provenance separately.

## Release gates (remain NO-GO)

- [ ] Product/privacy owner approves feedback deletion vs anonymization vs administrative retention
- [ ] Live DDL FK contradiction resolved in a reviewed forward migration and tested only in a disposable database first
- [ ] Migration ledger replay/fingerprint reconciliation, including missing educational SQL, resolved
- [ ] Auth, RLS, Storage and real integration behavior validated in authorized nonproduction setting
- [ ] Render public-variable parity checked with owner credentials, without secret exposure
- [ ] Second independently retrievable fallback OCI digest, retention/backup and restore drill approved and verified
- [ ] Explicit separate authorization for any merge, production Supabase schema change, Render Source switch, deploy or GHCR publishing

Current control boundary: PR #585 stays DRAFT; Render Free remains Git-backed, auto-deploy OFF; #536 stays OPEN.
