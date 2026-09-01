# Theme Reference Integration Ledger

Plan: `docs/superpowers/plans/2026-09-01-theme-reference-integration.md`

Ruling: Execute as an incremental Design System evolution — the repository is still at foundation stage, so adding reusable theme vocabulary now is lower-risk than retrofitting it after feature proliferation. Cost if wrong: some token/preset rework.

Ruling: Do not copy third-party Obsidian theme CSS or add theme repositories as runtime dependencies. Cost if wrong: lower visual fidelity, but substantially lower coupling and licensing/maintenance risk.

Ruling: Curate reference-derived themes instead of creating one preset per supplied repository. Cost if wrong: fewer presets than the raw reference list, but better usability and maintainability.

Ruling: Preserve the existing ten ThemeIds and add only materially distinct Arcana-owned presets.

## Task 1
- Status: in progress
- Shared-file scan: Tasks 1–3 share `types.ts` and `presets.test.ts`; Task 1 establishes invariants, Task 2 extends the contract, Task 3 consumes it. No contradictory interface found.
- Task 4 consumes the completed preset shape and only changes `apply-theme.ts` if integration tests expose a gap.
- Task 5 consumes all prior tasks and is verification/documentation only.
