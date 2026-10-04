# Academia Arcana — Supabase Migration Reconciliation — 2026-10-04

## Status

**P2 — GOVERNANÇA / DOCUMENTAÇÃO DE RECONCILIAÇÃO**

This record reconciles the authoritative production migration ledger observed on 2026-10-04 with the repository migration inventory. It does not rewrite production history and does not claim byte-for-byte identity between historical production migration payloads and later repository files.

## Authoritative evidence

Production records **23 applied migrations**. The audited repository inventory contains **21 migration files**. The difference is explained by historical consolidation: five production-only version identifiers are semantically represented by three later repository migrations.

Production history remains authoritative historical evidence. Repository migration files remain the canonical forward migration source.

## Reconciliation map

| Production identifier | Repository canonical representation |
|---|---|
| `20260929124554_product_social_focus` | `20260929153000_focus_social_foundation.sql` |
| `20260929142350_harden_friend_connection_updates` | `20260929153000_focus_social_foundation.sql` |
| `20260929201711_feedback_hub` | `20260929202000_feedback_hub.sql` + `20260929210000_feedback_hub_require_authenticated_owner.sql` |
| `20260929201757_feedback_hub_permissions` | `20260929202000_feedback_hub.sql` + `20260929210000_feedback_hub_require_authenticated_owner.sql` |
| `20260929202937_feedback_hub_require_authenticated_owner` | `20260929210000_feedback_hub_require_authenticated_owner.sql` |

These are semantic coverage mappings, not historical filename substitutions.

## Rules

1. Do not fabricate historical migration files.
2. Do not rename repository migrations to impersonate production history.
3. Do not mutate production solely to normalize historical identifiers.
4. Future migrations must use unique versions and remain traceable.
5. Consolidated migration behavior requires an explicit reconciliation record.
6. Production history and repository migration source must not be conflated.

## Classification

**P2 governance/documentation.** The discrepancy is not treated as a current P1 architecture blocker because the audited repository migrations semantically cover the observed production changes and the current database tests validate the affected application behavior.

This does not claim that a fully populated production database is reproducible from the repository alone; `supabase/seed.sql` remains absent.

## Closure statement

**RECONCILED FOR ARCHITECTURAL TRACEABILITY.**

Not claimed:
- byte-for-byte identity of historical production migration files;
- exact populated-production reproduction from repository files alone;
- authority to alter production migration history.

The production ledger is the historical source of truth for what was applied; the repository is the forward source of truth for future migrations.
