# Academia Arcana — Supabase Migration Reconciliation — 2026-10-04

## Status

**P2 — GOVERNANÇA / DOCUMENTAÇÃO DE RECONCILIAÇÃO**

This document records the relationship between the authoritative production migration ledger observed on 2026-10-04 and the repository migration files. It does **not** rewrite production history and does **not** claim byte identity between historical production migration payloads and later repository files.

## 1. Authoritative evidence

The production Supabase migration history records **23 applied migrations**.

The repository migration inventory at the audited baseline contains **21 migration files**.

The difference is explained by historical consolidation: five production-only version identifiers are semantically represented by three later repository migrations.

Production history remains authoritative historical evidence. Repository migration files remain the canonical forward migration source.

## 2. Reconciliation map

| Production history identifier | Repository canonical representation |
|---|---|
| `20260929124554_product_social_focus` | `20260929153000_focus_social_foundation.sql` |
| `20260929142350_harden_friend_connection_updates` | `20260929153000_focus_social_foundation.sql` |
| `20260929201711_feedback_hub` | `20260929202000_feedback_hub.sql` + `20260929210000_feedback_hub_require_authenticated_owner.sql` |
| `20260929201757_feedback_hub_permissions` | `20260929202000_feedback_hub.sql` + `20260929210000_feedback_hub_require_authenticated_owner.sql` |
| `20260929202937_feedback_hub_require_authenticated_owner` | `20260929210000_feedback_hub_require_authenticated_owner.sql` |

These mappings describe semantic coverage, not historical filename replacement.

## 3. Governance rules

1. Do not fabricate historical migration files.
2. Do not rename repository migrations to impersonate production history.
3. Do not mutate production solely to normalize historical identifiers.
4. Future migrations must use unique repository versions and remain traceable to the change they introduce.
5. Deliberate consolidation of migration behavior requires an explicit reconciliation record.
6. Production history and repository migration source have different evidentiary roles and must not be conflated.

## 4. Classification

The historical discrepancy is classified as **P2 governance/documentation**, not a current P1 architecture blocker, because the audited repository migrations semantically cover the observed production changes and the current database test suite validates the relevant application behavior.

This classification does not imply that a fully reproducible populated production database can be reconstructed from the repository alone; `supabase/seed.sql` remains absent.

## 5. Closure state

**RECONCILED FOR ARCHITECTURAL TRACEABILITY.**

Not claimed:

- byte-for-byte identity of historical production migration files;
- ability to reproduce the exact populated production database from repository files alone;
- authorization to alter production migration history.

The authoritative production ledger remains the historical source of truth for what was applied; the repository remains the forward source of truth for future migrations.
