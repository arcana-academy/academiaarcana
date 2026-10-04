# Academia Arcana — Design System 1.0

**Status:** IMPLEMENTED BASELINE  
**Authority:** Chat 03 — Design System  
**Repository:** `arcana-academy/academiaarcana`  
**Date:** 2026-10-03

## 1. Purpose

This document closes the foundational Design System contract for Academia Arcana.

The system is a reusable visual language for the product. It does not redefine product behavior, educational methodology, architecture, content, or the artistic universe.

## 2. Canonical direction

The primary visual identity is **Dark Fantasy Arcane + Arcane Academic**.

The default experience is dark and should communicate knowledge, mystery, discovery, depth, sophistication, progression, magic, and academia.

Personalization themes are presets over the same semantic contract. They do not create independent component systems and must not break accessibility or the shared interaction language.

## 3. Technical source of truth

The typed token system is canonical:

- `src/design-system/tokens/types.ts`
- `src/design-system/tokens/base.ts`
- `src/design-system/themes/presets.ts`
- `src/design-system/themes/apply-theme.ts`

`src/app/globals.css` provides the CSS fallback and component implementation layer. Runtime theme application writes the same semantic `--aa-*` variables.

No component may depend on a theme's decorative name to determine behavior.

## 4. Token contract

### Surfaces

`canvas → panel → elevated → floating → modal`

`inset` is reserved for recessed controls/content.

### Semantic color groups

- surfaces
- text
- border
- accent
- status
- focus

Status colors are never the only channel for communicating state.

### Spacing

`xs / sm / md / lg / xl / 2xl / 3xl`

Values:

- xs: 0.25rem
- sm: 0.5rem
- md: 1rem
- lg: 1.5rem
- xl: 2rem
- 2xl: 3rem
- 3xl: 4rem

### Control sizing

- small: 2.25rem
- medium: 2.75rem
- large: 3.25rem

These values are the baseline component heights; density may reduce visual spacing only where usability and touch/keyboard access remain valid.

### Radius

- sm: 0.375rem
- md: 0.625rem
- lg: 0.875rem
- xl: 1.25rem
- pill: 999px

### Typography

Families:

- body/label/caption/numeric: Acumin Pro with system fallbacks
- heading/display: Sanvito Pro with Georgia fallback
- code: platform monospace stack

The named families are preferred when available; the fallback stack is mandatory so the interface never depends on an unavailable proprietary font.

Scale:

- xs: 0.75rem
- sm: 0.875rem
- md: 1rem
- lg: 1.125rem
- xl: 1.25rem
- 2xl: 1.5rem
- 3xl: 1.875rem
- 4xl: 2.25rem
- 5xl: 3.5rem

Line heights:

- tight: 1.1
- normal: 1.5
- relaxed: 1.65

### Elevation

- sm: 0 1px 2px
- md: 0 8px 24px
- lg: 0 14px 36px
- floating: 0 18px 48px
- modal: 0 24px 72px

Shadows are supporting hierarchy, not a substitute for contrast or structure.

### Motion

- fast: 120ms
- normal: 180ms
- slow: 280ms
- reduced: 0ms

Standard and emphasized easing curves are tokenized.

All non-essential animation must respect `prefers-reduced-motion`.

### Breakpoints

Behavioral breakpoint baseline:

- sm: 40rem
- md: 48rem
- lg: 64rem
- xl: 80rem

Components may use a smaller number of these breakpoints than the full set. A new breakpoint requires a demonstrated layout need.

### Z-index

- base: 0
- sticky: 20
- dropdown: 30
- modal: 40
- toast: 50

No arbitrary stacking values should be introduced for ordinary UI.

### Opacity

- muted: 0.72
- disabled: 0.56
- overlay: 0.72

Disabled content must remain distinguishable through semantics and state, not opacity alone.

### Focus

- ring width: 3px
- offset: 3px
- semantic focus color: `focus.ring`

The system must retain a visible keyboard focus indicator.

## 5. Grid and layout

Canonical page maximum: 96rem.  
Canonical content maximum: 72rem.

The application shell may use wider layout where navigation or data density requires it.

Primary responsive behavior:

- desktop: persistent navigation may be used;
- medium widths: navigation can compress;
- small widths: navigation collapses into the mobile pattern;
- cards and multi-column layouts must reflow rather than overflow.

No component may require a fixed desktop width to remain usable.

## 6. Component contract

Fundamental reusable components currently established by the repository include:

- Button
- Input
- Card
- semantic surface/card primitives
- navigation patterns
- feedback/status patterns
- progress patterns
- empty/error states

Component APIs must expose intentional variants and states rather than arbitrary style escape hatches.

### Button

Variants:

- primary
- secondary
- ghost
- danger

Sizes:

- sm
- md
- lg

State contract:

- default
- hover
- focus
- active
- disabled
- loading

### Input

The field contract supports:

- label
- description
- validation/error
- accessible description association
- invalid state
- focus

Labels are not replaced by placeholders.

### Card

Variants:

- default
- elevated
- inset

Additional Arcana-specific visual treatments must compose with this primitive rather than bypassing it.

## 7. Arcana components

Arcana-specific components may include Grimoire, Quest, Rune, Sanctuary, Achievement, Spell, and similar concepts when product/domain requirements justify them.

They must inherit:

- semantic tokens;
- accessibility rules;
- responsive behavior;
- state conventions;
- component API discipline.

The artistic definition of their symbols and illustrations belongs to Mundo Visual.

## 8. Accessibility contract

Minimum target: **WCAG 2.2 AA**.

The Design System requires:

- keyboard operation;
- visible focus;
- semantic HTML;
- accessible names;
- programmatic relationships for labels/descriptions/errors;
- text contrast ≥ 4.5:1 for normal text;
- large-text contrast ≥ 3:1;
- meaningful non-text UI/state indicators ≥ 3:1;
- no color-only state communication;
- reflow at supported widths;
- usable zoom;
- reduced motion support;
- touch targets sized appropriately for the interaction;
- loading/error/success states communicated semantically.

The repository's contrast tests protect the theme token contract. They do not replace rendered accessibility testing of individual components.

## 9. Motion and visual effects

Glow, texture, gradients, and arcane atmosphere are optional visual treatments.

They may never:

- obscure text;
- reduce state clarity;
- replace focus;
- replace semantic hierarchy;
- create excessive animation;
- become necessary for understanding an action.

## 10. Themes

The repository contains a curated set of personalization presets. They share one token contract and one component system.

The canonical identity remains the default dark Arcane/Academic experience.

A theme is valid only when it satisfies the semantic token contract and accessibility tests.

No theme may introduce vendor-specific component APIs or an independent CSS architecture.

## 11. Design → Code synchronization

The synchronization chain is:

**token definition → CSS variable → component → documented usage → automated test**

Divergence is a defect.

When a divergence is found:

1. identify the authoritative source;
2. record the decision;
3. correct the implementation;
4. run focused tests;
5. run the broader Quality Gate when the change is ready for integration.

## 12. Performance

The Design System must avoid:

- unnecessary visual dependencies;
- duplicated icon libraries;
- large decorative assets for simple effects;
- uncontrolled animation;
- theme-specific component duplication.

Lucide React remains the official icon library.

## 13. Security-sensitive UI

Authentication, permission, confirmation and destructive-action components must use explicit semantics and safe defaults.

Destructive actions must not be visually indistinguishable from ordinary continuation actions.

## 14. Testing contract

Foundational components require tests covering the states relevant to their API.

At minimum:

- render;
- keyboard interaction;
- focus;
- disabled;
- loading where applicable;
- validation where applicable;
- accessible naming/relationships;
- responsive behavior where layout changes;
- regression against legacy styling patterns.

## 15. Decision register

### AA-DS-001 — Semantic token foundation
**Status:** IMPLEMENTED  
The Design System uses a typed semantic token contract and CSS custom properties.

### AA-DS-002 — Primary visual identity
**Status:** APPROVED  
Dark Fantasy Arcane + Arcane Academic is the default identity.

### AA-DS-003 — Accessibility baseline
**Status:** APPROVED  
WCAG 2.2 AA is a minimum product requirement.

### AA-DS-004 — Official icon library
**Status:** APPROVED  
Lucide React is the official icon library.

### AA-DS-005 — CSS architecture
**Status:** IMPLEMENTED  
The operational styling foundation is authored semantic CSS with `aa-*` classes and semantic `--aa-*` variables, consistent with AA-ARCH-001.

### AA-DS-006 — Shared component contract
**Status:** IMPLEMENTED  
Components use shared tokens, intentional variants, documented states, and accessible APIs.

### AA-DS-007 — Theme governance
**Status:** IMPLEMENTED  
Personalization presets share the same semantic contract and may not create parallel component systems.

### AA-DS-008 — Reduced motion
**Status:** IMPLEMENTED  
The system respects `prefers-reduced-motion`.

### AA-DS-009 — Focus treatment
**Status:** IMPLEMENTED  
The system uses a dedicated semantic focus token with a visible 3px indicator and 3px offset.

### AA-DS-010 — Consistency without uniformity
**Status:** APPROVED  
Different product areas may have distinct compositions while sharing the same foundational rules.

## 16. Definition of Done

The Design System foundation is considered closed when:

- the token contract is complete;
- theme presets inherit the complete contract;
- accessibility token tests pass;
- CSS fallback values match the canonical baseline;
- component APIs remain semantic;
- no legacy styling stack creates a second source of truth;
- documentation reflects implementation;
- the Quality Gate passes after integration;
- remaining findings are explicitly classified as outside Chat 03 authority.

## 17. Domain boundary

This document does not redefine:

- product strategy;
- educational model;
- application architecture;
- database;
- Auth/RLS;
- editorial language;
- artistic universe.

Cross-domain issues are registered and forwarded to the owning domain.
