# Academia Arcana — Fase 2 / Linguagem do Mundo

**Status:** CYCLE 1 — GRAMÁTICA ARCANA  
**Authority:** Chat 05 — Mundo Visual / Objetos Gráficos  
**Baseline:** `main@f182217572133eaaf3cce08bd1c0f16c35749b13`  
**Date:** 2026-10-07

## 1. Scope

Fase 1 — Fundação Visual is closed.

Fase 2 proceeds in the approved sequence:

11. gramática arcana;
12. assets;
13. objetos;
14. ilustrações;
15. ambientes;
16. sistema gráfico;
17. Flonts.

This document covers **item 11 — gramática arcana** and the minimum governance repair required before asset production can continue.

It does not redesign the token system, default theme, typography architecture, product behavior, authorization, database or closed UI/UX decisions.

## 2. Preserved baseline

The following remain authoritative:

- Dark Fantasy Arcane + Arcane Academic;
- Conhecimento → Academia → Mistério → Magia → Ornamentação;
- M0–M3;
- D0–D3;
- T0–T4;
- primitive → semantic → component → state;
- institutional symbol ≠ functional glyph;
- Display Family + UI Family;
- Lucide React as the functional icon base when semantically adequate;
- elevation ≠ magical effect;
- WCAG 2.2 AA;
- non-punitive contracts;
- personalization invariants;
- CURRENT ≠ TARGET ≠ implementation ≠ final canonization;
- AA-FLONTS-001–006 and absolute fidelity to real Flonts photographs.

## 3. Audit finding — identifier and canon conflict

The repository contained nine visual-asset metadata files using `AA-VIS-001` through `AA-VIS-009` and declaring their geometry `CANONICAL`. A grouped metadata file also used `AA-VIS-ICON-003–005` for three custom Academia entry icons.

Those identifiers conflict with the closed visual-decision register, and the status conflicts with the Fase 1 checkpoint, which explicitly leaves final brand, glyphs and world assets open.

The repository also contains current custom vectors without individual Phase 2 metadata.

### Resolution

- `AA-VIS-XXX` remains reserved for visual-system decisions.
- visual deliverables use `AA-ASSET-XXX`.
- the twelve legacy deliverables remain registered; ten have active consumers and two are unused candidates;
- their geometry is **not** promoted to final visual canon by repository age or current use;
- no SVG is deleted or visually redrawn in this cycle.

## 4. Arcane grammar

The Arcane visual language is semantic before it is ornamental.

A symbol may look magical only after its role, meaning and hierarchy are known.

### Graphic roles

Every non-trivial visual object must belong to exactly one primary role:

1. **Institutional identity** — organization-level mark, seal or brand identity.
2. **Domain sigil** — a bounded symbolic mark for one product/domain context.
3. **Functional icon** — directly communicates an action, object or navigation function.
4. **State/progression emblem** — represents achievement, continuity, level or another persisted state.
5. **World object / illustration** — depicts an object, artifact, character, scene or environment.
6. **Ornament / atmosphere** — decorative Arcane structure with no independent functional meaning.

A secondary decorative role may coexist with a primary role, but a decorative treatment may not silently acquire functional semantics.

## 5. Role boundaries

### Institutional identity

- may represent Academia Arcana as an institution;
- must not be replaced by a domain sigil;
- must not be used as a state indicator;
- final geometry remains pending Phase 2 validation.

### Domain sigil

- must map to one explicit domain/context;
- must not substitute the institutional identity;
- must not replace a conventional functional icon when comprehension would decrease;
- may be decorative in a context where nearby text supplies meaning.

### Functional icon

- Lucide React remains the default where an existing icon is semantically adequate;
- a custom icon requires identity or semantic need;
- comprehension takes priority over fantasy;
- labels are required when icon meaning is not immediately reliable.

### State/progression emblem

- cannot claim achievement, rarity, ownership, completion or ranking without backing application state;
- color or ornament alone cannot carry the state;
- nearby text/state semantics remain authoritative.

### World object / illustration

- may support narrative, recognition and atmosphere;
- must not become an interactive control unless explicitly designed as one;
- object depiction does not define product behavior.

### Ornament / atmosphere

- is non-semantic by default;
- should be hidden from assistive technology when redundant;
- cannot communicate warnings, success, completion, access or ranking by itself.

## 6. Informative-symbol contract

Any informative Arcane symbol must document:

- stable identifier;
- primary graphic role;
- explicit semantic meaning;
- allowed contexts;
- forbidden contexts;
- accessible treatment;
- label/text fallback;
- state dependencies;
- color dependence;
- responsive behavior;
- theme behavior;
- motion behavior when applicable.

Information may not depend on color, glow, ornament density or an unexplained symbol alone.

## 7. Decorative-symbol contract

Decorative Arcane graphics:

- carry no standalone product meaning;
- use empty alt text / `aria-hidden` when redundant in application UI;
- may reinforce atmosphere, hierarchy or module personality;
- may not imply product state;
- may not reduce text contrast, focus visibility or control legibility.

## 8. Cultural and originality boundary

The visual system must not arbitrarily reuse real-world religious, occult, ceremonial or culturally sensitive symbols as fantasy filler.

Original geometry must be preferred.

External references can inform direction, but recognizably distinctive external identities must not be reproduced.

## 9. Observed CURRENT motifs

The existing asset family repeatedly uses:

- circles and concentric fields;
- central nuclei;
- open-book motifs;
- gold/violet treatment;
- contained geometric forms.

These are **observed CURRENT motifs**, not automatically the final Arcane grammar.

They may survive validation, evolve, become role-specific or be deprecated.

Repetition alone does not make a motif canonical.

## 10. Asset register migrated in Cycle 1

| Asset ID | File | Current role | Status |
|---|---|---|---|
| AA-ASSET-001 | brand/aa-institutional-seal.svg | institutional identity | CURRENT / LEGACY IMPLEMENTATION |
| AA-ASSET-002 | sanctuary/aa-sanctuary-sigil.svg | domain sigil | CURRENT / LEGACY IMPLEMENTATION |
| AA-ASSET-003 | grimoires/aa-grimoire-cover-base.svg | world object / fallback cover | CURRENT / LEGACY IMPLEMENTATION |
| AA-ASSET-004 | gamification/aa-contained-arcane-flame.svg | state/progression emblem | CURRENT / LEGACY IMPLEMENTATION |
| AA-ASSET-005 | gamification/aa-achievement-emblem.svg | state/progression emblem | CURRENT / LEGACY IMPLEMENTATION |
| AA-ASSET-006 | focus/aa-focus-sigil.svg | domain sigil | CURRENT / LEGACY IMPLEMENTATION |
| AA-ASSET-007 | missions/aa-mission-document.svg | world object / domain motif | CURRENT / LEGACY IMPLEMENTATION |
| AA-ASSET-008 | intelligence/aa-arcane-core.svg | domain sigil | CURRENT / LEGACY IMPLEMENTATION |
| AA-ASSET-009 | icons/aa-library-mark.svg | custom knowledge mark | CURRENT / LEGACY IMPLEMENTATION |
| AA-ASSET-010 | icons/aa-workspace.svg | functional icon | UNUSED CANDIDATE |
| AA-ASSET-011 | icons/aa-cronograma.svg | functional icon | ACTIVE / LEGACY IMPLEMENTATION |
| AA-ASSET-012 | icons/aa-sanctuary.svg | functional icon | UNUSED CANDIDATE |

The three Academia entry icons share the grouped metadata file `icons/aa-academia-entry-icons.md`; individual role validation remains pending.

## 11. Decision register

### AA-VIS-036 — Semantic-first Arcane grammar
**Status:** CANONICAL / VALIDATED

Arcane graphics receive meaning from an explicit semantic contract, not from fantasy appearance.

### AA-VIS-037 — Primary graphic-role taxonomy
**Status:** CANONICAL / VALIDATED

Institutional identity, domain sigil, functional icon, state/progression emblem, world object/illustration and ornament/atmosphere are distinct primary roles.

### AA-VIS-038 — Role non-interchangeability
**Status:** CANONICAL / VALIDATED

A visual object cannot silently substitute another role. Institutional marks, sigils, icons, emblems, objects and ornaments require explicit remapping before cross-role reuse.

### AA-VIS-039 — Informative-symbol accessibility contract
**Status:** CANONICAL / VALIDATED

Informative symbols require textual/semantic support and may not depend on color or unexplained geometry alone.

### AA-VIS-040 — Decorative Arcana is non-semantic
**Status:** CANONICAL / VALIDATED

Decorative Arcane imagery may reinforce atmosphere but cannot independently communicate product state or action.

### AA-VIS-041 — Cultural/originality boundary
**Status:** CANONICAL / VALIDATED

Culturally sensitive real-world symbols are not used arbitrarily as fantasy filler; final Arcana symbols must have an original, documented purpose.

### AA-VIS-042 — Existing asset geometry is CURRENT, not automatically final canon
**Status:** CANONICAL / VALIDATED

Current use in product does not itself approve an asset as final identity. Existing SVGs may remain operational until Phase 2 validation or migration.

### AA-VIS-043 — Asset identifier namespace
**Status:** CANONICAL / VALIDATED

Visual deliverables use `AA-ASSET-XXX`. `AA-VIS-XXX` remains the decision namespace.

### AA-VIS-044 — Final asset validation gate
**Status:** CANONICAL / VALIDATED

Before final-canon promotion, an asset must be assessed for identity, coherence, function, hierarchy, accessibility, scalability, implementability, performance, originality and consistency. Flonts assets additionally require 5/5 identity fidelity.

## 12. CURRENT × TARGET × GAP × MIGRATION

### CURRENT

- a validated visual/token foundation;
- current SVG assets already used by the product;
- repeated but not fully governed Arcane motifs;
- twelve registered existing deliverables: ten active and two unused candidates;
- additional custom SVGs without complete Phase 2 metadata;
- functional Lucide usage across product surfaces.

### TARGET

- one documented semantic Arcane grammar;
- every custom graphic classified by role;
- complete asset inventory;
- no decision/asset identifier collision;
- no final-canon claim without validation evidence;
- consistent rules for objects, illustrations, environments and Flonts.

### GAP

- incomplete asset inventory;
- incomplete metadata on several custom SVGs;
- current motifs not yet evaluated for uniqueness and semantic saturation;
- brand/seal geometry not final-canon validated;
- domain sigils not yet validated as a coherent family;
- object/illustration/environment systems not yet defined.

### MIGRATION

1. reconcile identifiers and statuses — Cycle 1;
2. inventory every custom asset and consumer;
3. classify each by graphic role and semantic/decorative function;
4. validate or deprecate repeated motifs;
5. define object families;
6. define illustration levels and composition;
7. define environment language;
8. consolidate graphic system;
9. validate Flonts only from real photographic references.

## 13. Risks

### R-VIS-027 — Canon collision
**State:** RESOLVED IN CYCLE 1

Asset metadata no longer owns AA-VIS-001–009.

### R-VIS-028 — Premature canonization
**State:** MITIGATED

Existing product use is separated from final visual approval.

### R-VIS-029 — Nucleus/circle saturation
**State:** OPEN

The same central-nucleus/concentric-circle language appears across several current assets and may become generic or semantically overloaded.

### R-VIS-030 — Custom-icon ambiguity
**State:** REDUCED

The three Academia entry icons now have explicit IDs, roles and consumer status. Their geometry and Lucide-vs-custom justification remain pending validation.

### R-VIS-031 — Brand/sigil hierarchy ambiguity
**State:** REDUCED

The role taxonomy is now explicit, but the existing geometries still require validation against it.

### R-VIS-032 — Cultural-symbol drift
**State:** CONTROLLED

The grammar prohibits arbitrary borrowing, but future assets still require review.

## 14. Maturity

| Domain | Maturity |
|---|---|
| Fase 1 visual foundation | 4 — Validated in scope |
| Arcane grammar | 3 — Consolidated |
| Asset governance | 3 — Consolidated |
| Complete asset inventory | 1 — Explored |
| Object language | 1 — Explored |
| Illustration language | 1 — Explored |
| Environment language | 0 — Absent |
| Graphic system | 2 — Defined partially |
| Flonts governance | 3 — Consolidated |
| Flonts canonical representation | 0 — Absent |

## 15. Checkpoint — Cycle 1

### CONCLUÍDO

- Fase 2 officially opened without reopening Fase 1;
- Arcane graphic-role grammar established;
- asset/decision identifier collision repaired;
- twelve legacy asset identifiers migrated to AA-ASSET identifiers;
- existing asset geometry explicitly separated from final canon;
- accessibility and originality rules documented.

### ASSETS DEFINED

No new visual asset was produced.

Twelve existing deliverables were registered under AA-ASSET-001–012. Ten have active consumers; AA-ASSET-010 and AA-ASSET-012 are explicitly recorded as UNUSED CANDIDATE.

### PENDÊNCIAS

- complete repository asset inventory;
- metadata for current custom icons without records;
- role-by-role validation of all current SVGs;
- uniqueness/saturation review of repeated motifs;
- object-family system;
- illustration and environment systems;
- final brand/sigil validation;
- Flonts representation only after suitable real-photo references are available in the working context.

### PRÓXIMO CICLO

**FASE 2 — CICLO 2 — ASSET TAXONOMY + CURRENT INVENTORY**

Exact scope:

1. enumerate every custom visual asset and active consumer;
2. classify each as institutional, sigil, functional icon, state/emblem, world object/illustration or ornament;
3. classify informative × decorative;
4. register missing AA-ASSET identifiers/metadata where justified;
5. map module coverage;
6. record theme, accessibility, responsive and performance requirements;
7. identify duplicate, stale, semantically overloaded and unused assets;
8. do not redraw or mass-produce assets yet.
