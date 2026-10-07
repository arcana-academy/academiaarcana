# AA-ASSET-005 — Emblema Base de Conquista

Status: CURRENT / LEGACY IMPLEMENTATION  
Version: 1.0
Validation: PENDING — Fase 2 / Linguagem do Mundo
Category: gamification / achievement
File: `public/assets/gamification/aa-achievement-emblem.svg`

## Purpose

Base visual for the Academia Arcana achievement system. It provides the current base insignia geometry used to present milestones without implying a state that is not backed by application data.

## Visual construction

- shield-like academic plaque with contained arcane geometry;
- central four-point symbol around a stable nucleus;
- restrained gold/violet treatment;
- transparent background;
- scalable SVG delivery.

## Usage

Use as the base emblem on achievement surfaces. Specific achievement meaning remains in the adjacent title and description; this asset is not a substitute for persisted state.

## Accessibility

In application UI the image is decorative and uses an empty `alt`; the surrounding text carries the semantic meaning and unlocked state.

## Restrictions

Do not use the emblem alone to communicate category, completion, rarity, score or ownership. Those semantics require explicit adjacent content.


## Phase 2 governance

This file documents a CURRENT asset already present in the product. Its existing geometry may continue to be used operationally, but it is not final visual canon until it passes the Phase 2 world-language validation gate. The asset identifier uses the AA-ASSET namespace; AA-VIS identifiers are reserved for visual-system decisions.


## Phase 2 metadata

- **Graphic role:** state/progression emblem
- **Consumer status:** ACTIVE
- **Active consumers:** `src/app/conquistas/page.tsx`
- **Theme behavior:** PENDING — the current standalone SVG has not yet passed Phase 2 cross-theme validation.
- **Originality/source status:** repository-tracked source exists; external/source provenance and originality have not been independently verified in this cycle. Final-canon promotion remains blocked until that review is complete.
