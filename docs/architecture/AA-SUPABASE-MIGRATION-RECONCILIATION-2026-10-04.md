# Academia Arcana — Supabase Migration Reconciliation — 2026-10-04

> Scope: reconciliation of the production migration ledger with the repository migration inventory.
> Repository: `arcana-academy/academiaarcana`
> Production Supabase project: `fichnalpbcfjywwhixid`
> Repository baseline: `main` at `d66b7764ea439d160c4af7652f59e8f0738e17d4`

## 1. Finding

Production records **23 applied migrations** in `supabase_migrations.schema_migrations`.

The `main` repository contains **21 migration files**.

The difference is explained by historical consolidation/re-versioning in the Focus/Social and Feedback Hub areas. The five production-only version identifiers are not missing business behavior; their SQL is represented semantically by three later repository migration files.

This was verified from the authoritative production migration ledger, not inferred from filenames.

## 2. Reconciliation map

| Production migration | Repository representation | Reconciliation |
|---|---|---|
| `20260929124554_product_social_focus` | `20260929153000_focus_social_foundation.sql` | Consolidated. The repository migration creates both `focus_sessions` and `friend_connections`, including the production constraints, indexes, RLS and grants. It additionally enforces `completed_at >= started_at` for focus sessions. |
| `20260929142350_harden_friend_connection_updates` | `20260929153000_focus_social_foundation.sql` | Consolidated. The repository migration includes the restricted column-level update grant and participant policy in the same migration. |
| `20260929201711_feedback_hub` | `20260929202000_feedback_hub.sql` + `20260929210000_feedback_hub_require_authenticated_owner.sql` | Consolidated/re-versioned. The repository creates the same feedback table with the final owner constraint represented by the subsequent migration. |
| `20260929201757_feedback_hub_permissions` | `20260929202000_feedback_hub.sql` + `20260929210000_feedback_hub_require_authenticated_owner.sql` | Consolidated. The repository migration already applies the final authenticated-only table privileges. |
| `20260929202937_feedback_hub_require_authenticated_owner` | `20260929210000_feedback_hub_require_authenticated_owner.sql` | Re-versioned equivalent. The final `user_id NOT NULL` constraint and authenticated-only grants are represented explicitly. |

## 3. Important distinction

The repository does **not** reproduce the production migration ledger byte-for-byte.

It does, however, contain a semantically consolidated migration path for the affected product capabilities.

This distinction is material:

- production migration history remains authoritative historical evidence;
- repository migrations are the canonical forward migration source for the current codebase;
- historical migration identifiers must not be fabricated or renamed merely to make counts match;
- future migrations must use new, unique version identifiers;
- destructive or corrective reconciliation must not be performed against production solely to normalize historical version numbers.

## 4. Production schema evidence

The current production database exposes:

- `focus_sessions` with owner-scoped RLS;
- `friend_connections` with participant-scoped RLS and restricted update privileges;
- `feedback_responses` with authenticated owner enforcement;
- all affected tables protected by RLS;
- current TypeScript schema generation exposes the expected tables and RPCs.

The production migration ledger confirms the original five migration statements and permits direct comparison against the repository versions.

## 5. Validation

The repository's Database Tests workflow successfully:

- started a local Supabase instance;
- applied the repository migrations;
- executed Focus/Social privilege tests;
- executed Feedback Hub privilege tests;
- executed the remaining database security and educational tests.

All database-test steps completed successfully on the audited branch.

Therefore the current migration set is operationally executable and testable from scratch.

## 6. Architectural decision

**Decision: ACCEPTED AS HISTORICAL MIGRATION CONSOLIDATION, NOT AS A PERFECT LEDGER MATCH.**

No production migration should be rewritten, deleted, renamed or replayed merely to make the historical count identical.

The architecture remains valid because:

1. the production ledger is preserved;
2. the repository has a traceable semantic mapping for the divergent history;
3. the current repository migration set applies successfully in local database tests;
4. current production schema evidence is consistent with the mapped capabilities;
5. no speculative SQL reconstruction is required.

## 7. Remaining governance requirement

The migration-history discrepancy is no longer treated as an unresolved P1 architecture defect.

It remains a **P2 governance/documentation constraint**:

> Future schema changes must preserve a one-to-one traceable relationship between newly introduced migration files and the migration versions applied to production.

Any deliberate migration squashing/consolidation must record an explicit reconciliation manifest like this one before release.

## 8. Status

**RECONCILED — SEMANTICALLY MAPPED AND VALIDATED.**

**Historical ledger byte identity: NOT CLAIMED.**

**Current repository migration execution: VALIDATED.**

**Production schema correctness: NOT re-inferred solely from migration filenames; verified independently through current schema inspection.**
