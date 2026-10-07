# Academia — Learning Area Icons

Status: MIXED — ACTIVE + UNUSED CANDIDATES  
Validation: PENDING — Fase 2 / Linguagem do Mundo  
Category: functional custom icons

Repository visual assets originally created for three Academia learning entry points.

- **AA-ASSET-010** — `aa-workspace.svg`
  - Graphic role: functional icon
  - Consumer status: UNUSED CANDIDATE — no active consumer found in `src` during Cycle 1
  - Intended meaning: organization of knowledge / grimoire
- **AA-ASSET-011** — `aa-cronograma.svg`
  - Graphic role: functional icon
  - Consumer status: ACTIVE
  - Active consumer: `src/components/planning/StudyTaskBoard.tsx`
  - Intended meaning: planning / time / rhythm
- **AA-ASSET-012** — `aa-sanctuary.svg`
  - Graphic role: functional icon
  - Consumer status: UNUSED CANDIDATE — no active consumer found in `src` during Cycle 1
  - Intended meaning: orientation / continuity / sanctuary

The icons currently share geometric treatment, gold/violet coloring, clear silhouettes, transparent backgrounds and scalable SVG delivery.

Where used decoratively in application UI, the adjacent text must remain the semantic label.

## Phase 2 metadata

- **Theme behavior:** PENDING — these standalone SVGs have not yet passed Phase 2 cross-theme validation.
- **Originality/source status:** repository-tracked sources exist; external/source provenance and originality have not been independently verified in this cycle. Final-canon promotion remains blocked until that review is complete.
- **Validation rule:** an unused file must not be classified as CURRENT application usage merely because it exists in `public/assets`.

## Phase 2 governance

These files are existing deliverables, not final visual canon. The active Cronograma icon may continue operationally. Workspace and Sanctuary entry icons remain unused candidates until a real consumer or an explicit migration decision exists.

Custom functional icons must be validated against Lucide React before final-canon promotion. A custom icon is justified only when the standard functional vocabulary is insufficient or an approved identity requirement demands a custom mark.

AA-ASSET is the identifier namespace for these deliverables; AA-VIS remains reserved for visual-system decisions.
