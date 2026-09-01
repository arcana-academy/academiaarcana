# Academia Arcana — Design System Master

## Goal

Establish one professional, accessible, multi-theme design system for Academia Arcana using semantic tokens. Components must not depend on theme-specific colors or duplicate implementations per theme.

## Architecture

- CSS custom properties are the runtime source of truth.
- TypeScript defines the token and theme contracts.
- Tailwind consumes semantic CSS variables rather than concrete theme colors.
- Theme presets provide values; components consume semantic intent.
- Existing approved themes remain available; theme changes never require component duplication.

## Token layers

1. Primitive values: color, typography, spacing, radius, shadow, motion.
2. Semantic values: surfaces, text, borders, accents, status, focus, typography, spacing, radius, elevation, shadows, motion, density, effects.
3. Component contracts: only when a component needs semantic state/variant tokens.

## Required semantic domains

- Color
- Surface
- Text
- Border
- Accent
- Status: success, warning, danger, info
- Focus
- Typography
- Spacing
- Radius
- Shadows
- Elevation
- Motion
- Density
- Effects

## Accessibility contract

All applicable components expose predictable default, hover, active, focus-visible, disabled, loading, error, success, warning, selected and pressed states. Keyboard operation and visible focus are mandatory. Reduced motion must be respected. Typography must remain legible at increased font sizes. Status must not rely on color alone. Contrast must meet WCAG 2.2 AA as the baseline.

## Surface rule

#FFFFFF must never be the dominant interface surface. Light themes may be light, but must preserve Arcana identity through tinted or otherwise non-pure-white surfaces.

## Base components

Existing components are to be migrated and strengthened rather than duplicated: Button, IconButton, Input, Card, Badge and Progress. Missing primitives are to be introduced only where no suitable existing implementation exists: Modal, Tooltip, Select, Tabs, Dialog, Toast, Empty State and Skeleton.

## Component contract principle

One component + semantic tokens + multiple themes. No component may hard-code a theme-specific color. Public props should express behavior and semantic variants rather than palette values.

## Process

Audit → Tokens → Tests → Implementation → Accessibility → Tests → Build.

TDD applies to behavior changes: tests are written first, verified failing for the intended reason, then production code is added minimally and verified green.

## Success criteria

- All approved themes remain registered and render through the same component implementations.
- Semantic token coverage is complete for required domains.
- Base components consume semantic tokens and expose accessible states.
- Theme-specific color literals are not embedded in component implementations.
- Reduced-motion behavior is covered.
- Accessibility and regression tests cover the design-system contract.
- Typecheck, lint, tests and build pass before completion claims.
