# AA-ASSET-001 — Institutional Seal

Status: CURRENT / LEGACY IMPLEMENTATION  
Version: 1.0
Validation: PENDING — Fase 2 / Linguagem do Mundo  
Category: brand / identity  
File: `public/assets/brand/aa-institutional-seal.svg`

## Purpose

Current institutional-seal implementation for Academia Arcana.

## Visual construction

- circular institutional geometry;
- portal motif;
- open-book motif;
- central arcane nucleus;
- restrained gold and violet treatment;
- transparent background;
- scalable SVG delivery.

## Current uses

- authenticated application navigation;
- institutional identity surfaces;
- compact brand contexts;
- future documents and achievement surfaces when explicitly mapped.

## Accessibility

The SVG includes an internal title and description for direct document embedding. When used beside visible Academia Arcana text in the application shell, the image is intentionally decorative and uses an empty alt text to avoid duplicating the accessible label.

## Restrictions

Do not recolor, distort, rotate, add unrelated symbols, or replace the current geometry without an explicit Phase 2 migration with text glyphs.

## Repository role

This is a current web deliverable. Editable source artwork remains outside `public/assets/` according to the repository's visual asset policy.


## Phase 2 governance

The asset remains a CURRENT implementation. Its geometry is not promoted to final visual canon until it passes the Phase 2 world-language validation gate. The asset identifier uses the AA-ASSET namespace; AA-VIS identifiers are reserved for visual-system decisions.


## Phase 2 metadata

- **Graphic role:** institutional identity
- **Consumer status:** ACTIVE
- **Active consumers:** `src/components/layout/Sidebar.tsx`, `src/components/layout/AuthenticatedShell.tsx`
- **Theme behavior:** PENDING — the current standalone SVG has not yet passed Phase 2 cross-theme validation.
- **Originality/source status:** repository-tracked source exists; external/source provenance and originality have not been independently verified in this cycle. Final-canon promotion remains blocked until that review is complete.
