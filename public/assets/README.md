# Academia Arcana — Current Visual Assets

This directory contains web-ready visual assets present in the repository. Some are active application assets; others may be unused candidates pending Phase 2 validation.

## Governance status

The files in this directory are **CURRENT implementation assets**. They are not automatically final visual canon.

Phase 2 — Linguagem do Mundo governs their validation. An asset becomes final visual canon only after its role, semantics, accessibility, originality, theming behavior, responsive use, performance and system coherence are validated.

Asset records use the `AA-ASSET-XXX` namespace. The `AA-VIS-XXX` namespace is reserved for visual-system decisions.

## Categories

- `brand/` — logos, marks, seals and identity assets
- `backgrounds/` — atmospheric backgrounds and textures
- `characters/` — character and mascot artwork
- `grimoires/` — grimoire and chapter artwork
- `missions/` — mission artwork
- `gamification/` — progression, achievement and continuity symbols
- `achievements/` — badges, seals and achievement artwork
- `sanctuary/` — Sanctuary-specific visual assets
- `education/` — educational illustrations and printable resources
- `icons/` — custom vector icons and symbols
- `focus/` — focus and concentration symbols
- `intelligence/` — Mestre Arcano and intelligence-system symbols
- `marketing/` — launch and communication assets

## Registered existing assets

### Institutional identity

- `AA-ASSET-001` — `brand/aa-institutional-seal.svg`
- metadata: `brand/aa-institutional-seal.md`

### Sanctuary and learning areas

- `AA-ASSET-002` — `sanctuary/aa-sanctuary-sigil.svg`
- metadata: `sanctuary/aa-sanctuary-sigil.md`
- `AA-ASSET-010` — `icons/aa-workspace.svg` — UNUSED CANDIDATE
- `AA-ASSET-011` — `icons/aa-cronograma.svg` — ACTIVE
- `AA-ASSET-012` — `icons/aa-sanctuary.svg` — UNUSED CANDIDATE
- shared metadata: `icons/aa-academia-entry-icons.md`
- `AA-ASSET-009` — `icons/aa-library-mark.svg`
- metadata: `icons/aa-library-mark.md`

### Knowledge and Grimoires

- `AA-ASSET-003` — `grimoires/aa-grimoire-cover-base.svg`
- metadata: `grimoires/aa-grimoire-cover-base.md`

### Gamification and Missions

- `AA-ASSET-004` — `gamification/aa-contained-arcane-flame.svg`
- metadata: `gamification/aa-contained-arcane-flame.md`
- `AA-ASSET-005` — `gamification/aa-achievement-emblem.svg`
- metadata: `gamification/aa-achievement-emblem.md`
- `AA-ASSET-007` — `missions/aa-mission-document.svg`
- metadata: `missions/aa-mission-document.md`

### Focus and Intelligence

- `AA-ASSET-006` — `focus/aa-focus-sigil.svg`
- metadata: `focus/aa-focus-sigil.md`
- `AA-ASSET-008` — `intelligence/aa-arcane-core.svg`
- metadata: `intelligence/aa-arcane-core.md`

## Metadata contract

Every Markdown file below `public/assets/`, except this `README.md`, is an asset metadata record and must satisfy this contract.

Every registered asset record must document:

- stable `AA-ASSET-XXX` identifier;
- repository/consumer status (ACTIVE, UNUSED CANDIDATE, CURRENT legacy implementation, or later validated state);
- category and role;
- purpose and semantic meaning;
- allowed and forbidden uses;
- accessibility treatment;
- theming behavior when applicable;
- implementation path;
- originality/source status;
- Phase 2 validation result before final-canon promotion.

Functional icons should continue to use Lucide React when semantically adequate. A custom vector does not become an Arcana symbol merely because it is decorative or bespoke.

Keep editable source files in the appropriate source-art library. This directory contains web deliverables, not raw working files.
