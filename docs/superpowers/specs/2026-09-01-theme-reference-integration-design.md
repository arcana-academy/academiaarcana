# Theme Reference Integration — Design

## Context

The Academia Arcana already has a centralized theme system under `src/design-system`, with typed theme tokens, presets, theme application, context, and tests. The new reference set contains many Obsidian themes and adjacent visual systems. The goal is to extract useful visual patterns without importing third-party theme CSS wholesale or creating one implementation per reference.

## Problem

The current theme model is intentionally compact, but the growing reference library exposes useful dimensions such as density, typography, surfaces, borders, contrast, radius, shadows, focus treatment, and visual texture. We need to incorporate those patterns while preserving one coherent Arcana theme engine, accessibility requirements, the existing domain boundaries, and the prohibition on pure white UI surfaces/text.

## Decision

Evolve the existing theme engine incrementally rather than introducing a parallel styling system. References are source material, not runtime dependencies. Theme presets remain `ThemePreset` records backed by a shared token contract. New visual dimensions are added only when they are demonstrably reusable across multiple themes.

The first implementation phase will focus on the theme architecture and the reference-derived preset layer. It will not copy vendor CSS, add third-party runtime dependencies, or redesign unrelated application domains.

## Architecture

```text
ThemeContext
    ↓
ThemePreset
    ↓
Semantic ThemeTokens
    ↓
CSS variables / existing application
    ↓
Components
```

Reference themes are analyzed offline and converted into Arcana-owned semantic values:

```text
Obsidian references
        ↓
pattern extraction
        ↓
Arcana semantic tokens
        ↓
Arcana presets
```

## Token direction

Existing tokens remain authoritative. Candidate extensions are:

- density / compactness;
- surface hierarchy;
- typography roles beyond body/heading where justified;
- border emphasis;
- radius profile;
- shadow profile;
- focus treatment;
- motion profile;
- optional visual texture/elevation only if it remains accessible and performant.

Do not add a token merely because one reference theme uses it.

## Reference classification

### Structural/editor references

- Notebook Navigator: navigation and document hierarchy patterns.
- Obsidian Composer: composition/editor interaction patterns.
- Origami: information organization and visual structure.

These are not theme dependencies. They may inform future `learning`/editor work separately.

### Visual/theme references

The supplied themes are treated as inspiration for palettes, density, typography, surfaces, borders, and visual personality. Their source CSS is not copied wholesale.

### Operational reference

UptimeRobot is infrastructure/observability, not a theme. It is outside this theme implementation and must not become an application runtime dependency as part of this change.

## Constraints

- Preserve the modular monolith.
- Preserve the existing theme IDs and compatibility for current users.
- No pure white UI background or pure white text.
- WCAG 2.2 AA remains the minimum.
- Reduced motion must continue to work.
- Theme changes must not alter authorization, persistence, or domain contracts.
- Avoid new runtime dependencies unless independently justified.
- Keep theme configuration centralized.
- Prefer additive migration over destructive replacement.

## Alternatives considered

### A — Import each Obsidian theme

Rejected. Creates duplicated CSS systems, licensing/maintenance risk, inconsistent accessibility, and uncontrolled coupling.

### B — Build a separate theme engine from scratch

Rejected. Duplicates infrastructure already present in `src/design-system/themes` and increases migration cost.

### C — Extend the existing Arcana theme engine with reference-derived semantic presets

Accepted. Reuses current contracts and tests, keeps the architecture coherent, and allows the reference library to improve visual variety without becoming a dependency.

## Consequences

Positive:

- one source of truth for themes;
- easier accessibility validation;
- smaller runtime surface;
- reference-inspired variety without vendor coupling;
- incremental migration;
- future themes can reuse semantic tokens.

Negative:

- some visual details from references will be intentionally approximated;
- additional token dimensions increase the design-system contract and must be governed;
- every new preset increases the QA matrix.

## Migration

1. Preserve existing theme IDs and behavior.
2. Add only validated shared token dimensions.
3. Add new reference-derived presets in controlled batches.
4. Test token completeness and accessibility constraints.
5. Validate all existing themes remain stable.
6. Only then consider removing redundant legacy theme definitions, if any.

## Rollback

Theme changes are isolated to design-system theme files. A rollback can revert the preset/token commits without affecting application data. If a new token is introduced, its consumers must remain backward-compatible until the migration is complete.

## Status

accepted
