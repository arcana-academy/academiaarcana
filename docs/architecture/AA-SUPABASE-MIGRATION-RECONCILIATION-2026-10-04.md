# Academia Arcana — Supabase Migration Reconciliation — 2026-10-04

> Scope: reconciliation of the production migration ledger with the repository migration inventory.
> Repository: `arcana-academy/academiaarcana`
> Production Supabase project: `fichnalpbcfjywwhixid`
> Runtime evidence snapshot: Render deploy `dep-db0rk9gjo6nc739v4ekg`, commit `d66b7764ea439d160c4af7652f59e8f0738e17d4`
> Note: this manifest records the authoritative migration evidence observed during the 2026-10-04 audit. It does not claim that a later documentation-only `main` commit is already LIVE.

## 1. Finding

Production records **23 applied migrations** in `supabase_migrations.schema_migrations`.

The repository migration inventory contains **21 migration files** at the audited baseline. The difference is explained by historical consolidation/re-versioning in the Focus/Social and Feedback Hub areas.

Five production-only version identifiers are represented semantically by three later repository migration files. This was established from the authoritative production migration ledger and current schema/security evidence, not inferred from filenames alone.

## 2. Reconciliation map

| Production migration | Repository representation | Reconciliation |
|---|---|---|
| `20260929124554_product_social_focus` | `20260929153000_focus_social_foundation.sql` | Consolidated. The repository migration represents the Focus/Social schema, constraints, indexes, RLS and grants required by the production capability. |
| `20260929142350_harden_friend_connection_updates` | `20260929153000_focus_social_foundation.sql` | Consolidated. Restricted friend-connection update privileges and participant policy are represented in the consolidated migration. |
| `20260929201711_feedback_hub` | `20260929202000_feedback_hub.sql` + `20260929210000_feedback_hub_require_authenticated_owner.sql` | Consolidated/re-versioned. The final owner constraint is represented by the subsequent repository migration. |
| `20260929201757_feedback_hub_permissions` | `20260929202000_feedback_hub.sql` + `20260929210000_feedback_hub_require_authenticated_owner.sql` | Consolidated. The repository path represents the final authenticated-only privileges. |
| `20260929202937_feedback_hub_require_authenticated_owner` | `20260929210000_feedback_hub_require_authenticated_owner.sql` | Re-versioned equivalent. The final `user_id NOT NULL` constraint and authenticated-only grants are represented explicitly. |

## 3. Architectural interpretation

The repository does **not** reproduce the historical production migration ledger byte-for-byte.

The correct interpretation is:

- production migration history remains authoritative historical evidence;
- repository migrations are the canonical forward migration source;
- historical migration identifiers must not be fabricated, renamed or replayed merely to make counts match;
- future migrations must use unique, traceable versions;
- production must not be mutated solely to normalize historical migration identifiers;
- deliberate migration consolidation must produce an explicit reconciliation artifact.

This is a **P2 governance/documentation constraint**, not a current P1 architecture blocker, because the affected product capabilities are represented and the repository migration set was validated through database tests.

## 4. Current schema/security evidence

The audit independently established the relevant production state:

- affected Focus/Social and Feedback Hub tables exist;
- RLS is enabled on the inspected product tables;
- owner/participant policies are present where required;
- no `anon` table grants were observed on the inspected product tables;
- the relevant application-facing RPCs are not exposed to `anon`;
- privileged private functions use constrained `SECURITY DEFINER` patterns with explicit authorization/ownership checks.

These observations are separate from migration filenames and therefore are not inferred solely from the reconciliation map.

## 5. Reproducibility validation

The repository migration set was executed through the database-test workflow in an isolated local Supabase environment.

The relevant Focus/Social, Feedback Hub, integration, educational and objective-evidence database tests completed successfully during the audited cycle.

Therefore:

**Current repository migration execution: VALIDATED.**

**Historical production ledger byte identity: NOT CLAIMED.**

## 6. Governance rule

For every future schema change:

1. create a unique migration version;
2. preserve a traceable relationship between repository migration and production application;
3. do not reuse historical versions;
4. if migrations are deliberately consolidated or re-versioned, create/update a reconciliation manifest before release;
5. validate the resulting schema independently rather than treating migration filenames as proof of production state.

## 7. Status

**RECONCILED — SEMANTICALLY MAPPED AND VALIDATED.**

**P2 governance/documentation requirement — controlled.**

**No production migration rewrite is authorized or required by this reconciliation.**
