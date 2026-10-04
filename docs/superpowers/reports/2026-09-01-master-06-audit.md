# Master 06 — Design System Audit

## Status

Audit completed before implementation. Approach A approved: deep audit → minimal corrections → targeted tests → Quality Gate.

## Findings

### Preserve

- Centralized design-system theme engine under `src/design-system`.
- Semantic token contract for surfaces, text, borders, accents, status, focus, radius, spacing, typography, shadows, motion, density, and effects.
- Existing theme presets and shared `createPreset` merge strategy.
- Global focus-visible and reduced-motion foundations.
- Accessible Button, Input, Card, Badge, Progress, and VisuallyHidden primitives.
- Strict TypeScript and Next/ESLint configuration.
- No speculative parallel theme engine or third-party theme CSS.

### Corrections required

1. Configure `@testing-library/jest-dom/vitest` in the central Vitest setup so DOM matchers are available consistently.
2. Require `aria-label` on `IconButton` at the TypeScript contract level.

### Evaluate, but do not change in this pass

- `paper-light` naming versus its currently dark paper-like palette.
- Possible first-render theme application behavior in `ThemeProvider`.
- Complete responsive AppShell/Sidebar/MobileNavigation work belongs to the later application-shell slice, not these minimal corrections.
- Tailwind should not be installed merely to satisfy historical stack wording while the current design system is functioning through semantic CSS variables.

### Out of scope

- Rewriting the design system.
- Parallel token/theme layer.
- New product domains or data models.
- Supabase/authorization changes.
- AI/Mestre Arcano/Flonts data access.
- Master 07.
