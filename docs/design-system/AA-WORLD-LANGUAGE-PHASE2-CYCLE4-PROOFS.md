# Academia Arcana — Fase 2 / Ciclo 4 — Proof Surfaces

**Status:** VALIDATED AT PROOF LEVEL / APPROVED WITH CONSTRAINT  
**Authority:** Chat 05 — Mundo Visual / Objetos Gráficos  
**Implementation baseline:** `main@16d78bb87a4f674fc8198725d5cab79c2b520a19`  
**Validation PR:** #568  
**Scope:** AA-PROOF-001–004 only

## 1. Scope boundary

This cycle validates a controlled visual-language proof lab. It does **not** promote:

- proof geometry to product UI;
- CURRENT legacy SVGs to final canon;
- new AA-ASSET deliverables;
- brand identity;
- final glyphs;
- Flonts representation.

The route `/design-system/proofs` remains a design-system laboratory.

## 2. Proof matrix

| Proof | Regime | Target | Verdict |
|---|---|---|---|
| AA-PROOF-001 | Focus | M0 / T0 / D0 / functional + activation | APPROVED WITH CONSTRAINT |
| AA-PROOF-002 | Grimoires | M1 / T1–T2 / D1 / ambient | APPROVED WITH CONSTRAINT |
| AA-PROOF-003 | Sanctuary | M2 / T2–T3 / D2 / ambient + conditional transformation | APPROVED WITH CONSTRAINT |
| AA-PROOF-004 | Exceptional achievement | M3 / T3–T4 / D3 / transformation + reward | APPROVED WITH CONSTRAINT |

Every proof compares CURRENT × TARGET × NEGATIVE CONTROL.

## 3. Visual inspection finding

The first implementation passed automated semantic gates but direct visual inspection rejected the initial AA-PROOF-003 and AA-PROOF-004 TARGET layouts because their internal two-column composition compressed explanatory copy inside the A/B/C comparison card.

The layouts were iterated before any baseline was accepted:

- Sanctuary content became a stable wider content plate with peripheral atmosphere;
- Exceptional achievement became a vertical ritual composition with a centered emblem and full-width content plate;
- mobile removes Sanctuary atmosphere and the achievement reward halo.

This confirms that deterministic screenshots are a regression mechanism, not an aesthetic approval mechanism.

## 4. Accessibility evidence

The proof E2E suite validates:

- three representative viewports: 375×812, 768×1024, 1280×900;
- no horizontal overflow;
- explicit keyboard focus on every TARGET;
- reduced-motion semantic equivalence;
- decorative-asset failure tolerance;
- all 40 maintained themes;
- composed text contrast after gradients/material treatment.

The composed contrast gate evaluates 2 explicit content texts × 4 TARGETs × 40 themes = **320 composed checks at >= 4.5:1**.

The token-level contrast contract remains separate from this composed-surface validation.

## 5. Responsive evidence

Each of the four proofs is present as A/B/C on mobile, tablet and desktop.

The target behavior is subtractive:

- Focus remains T0 and quiet;
- Grimoires keeps the material object while the functional plate remains stable;
- Sanctuary removes atmosphere on the narrow mobile state;
- Exceptional achievement removes the reward halo on narrow mobile while preserving title, explanation and action.

## 6. Theming evidence

All 40 ThemePresets pass the proof structure/reflow and composed-contrast gates.

This is technical cross-theme validation. It does not claim that every theme has received a separate human aesthetic review.

## 7. Performance evidence

No arbitrary budget was introduced.

Measured CURRENT asset source sizes used by the proof lab:

| Asset | Bytes |
|---|---:|
| Focus sigil | 1316 |
| Grimoire base cover | 1904 |
| Sanctuary sigil | 1611 |
| Achievement emblem | 1525 |
| Total | 6356 |

Measured TARGET DOM/effect evidence:

| Proof | Descendant DOM elements | CSS filter/backdrop-filter elements | Infinite animations |
|---|---:|---:|---:|
| AA-PROOF-001 | 22 | 0 | 0 |
| AA-PROOF-002 | 13 | 0 | 0 |
| AA-PROOF-003 | 13 | 0 | 0 |
| AA-PROOF-004 | 18 | 0 | 0 |

The AA-PROOF-004 reveal uses only a finite animation and becomes static under `prefers-reduced-motion: reduce`.

## 8. Visual regression evidence

The lab freezes 36 deterministic hashes:

`4 proofs × 3 variants × 3 viewports = 36`.

Before acceptance, the complete hash set reproduced identically across all three Playwright retries after the visual iteration.

The baseline manifest therefore records the iterated composition, not the initially rejected layout.

## 9. Proof verdict constraints

### AA-PROOF-001 — APPROVED WITH CONSTRAINT

- activation remains restrained and non-reward;
- meaning cannot depend on animation, glow or AA-ASSET-006;
- M0/T0/D0 is the authoritative proof intent.

### AA-PROOF-002 — APPROVED WITH CONSTRAINT

- T2 is localized to the world object;
- the functional content plate remains M0–M1/T0–T1;
- AA-ASSET-003 remains CURRENT / LEGACY and is not promoted to final material canon.

### AA-PROOF-003 — APPROVED WITH CONSTRAINT

- T3 stays peripheral;
- atmosphere is removable on mobile;
- CTA/copy remain on a stable functional plate;
- AA-ASSET-002 remains decorative CURRENT / LEGACY geometry.

### AA-PROOF-004 — APPROVED WITH CONSTRAINT

- M3 is transient;
- the proof validates the peak ritual composition only;
- production choreography from reveal → settled state remains unimplemented;
- AA-ASSET-005 remains CURRENT / LEGACY geometry.

## 10. Negative controls

Negative controls remain deliberately wrong and are not candidate designs:

- Focus: magic saturation;
- Grimoires: full-card skeuomorphism;
- Sanctuary: permanent D3 atmosphere;
- Achievement: persistent M3 across the list.

They exist to make rejection criteria visible.

## 11. CURRENT × TARGET × GAP × MIGRATION

### CURRENT

- isolated public proof lab;
- typed AA-PROOF registry;
- A/B/C proof matrices;
- responsive variants;
- theme switching infrastructure;
- automated composed-a11y gates;
- performance evidence;
- deterministic regression manifest.

### TARGET

- preserve approved proof constraints;
- decide which proof learnings deserve system-rule promotion;
- inventory/migrate product consumers only after an explicit later cycle;
- keep legacy assets distinct from final canon.

### GAP

- no production consumer has migrated to TARGET;
- no existing AA-ASSET geometry has become final canon;
- AA-PROOF-004 temporal product choreography is not implemented;
- no exhaustive human aesthetic review exists for all 40 themes;
- no Flonts asset exists.

### MIGRATION

`proof evidence → constraint consolidation → candidate rule/token/asset mapping → targeted product pilot → runtime validation → only then production promotion`.

## 12. Risk update

- Texture accessibility regression: REDUCED / gated by composed contrast.
- GPU/paint overload: REDUCED in current proofs; no filters or infinite animations measured.
- Responsive mismatch: REDUCED / three viewport gates plus direct mobile inspection.
- Theme/material collision: REDUCED technically; broad human aesthetic review remains open.
- Motif saturation: OPEN — current legacy assets still repeat nucleus/concentric motifs.
- Proof-as-canon confusion: CONTROLLED — AA-PROOF namespace and route remain explicit.
- M3 permanence: CONTROLLED — only transient proof is approved.

## 13. Maturity

| Domain | Maturity |
|---|---|
| Proof protocol | 4 — Validated |
| AA-PROOF-001 language | 4 — Validated with constraint |
| AA-PROOF-002 language | 4 — Validated with constraint |
| AA-PROOF-003 language | 4 — Validated with constraint |
| AA-PROOF-004 peak language | 4 — Validated with constraint |
| AA-PROOF-004 production choreography | 2 — Defined, not implemented |
| Responsive proof behavior | 4 — Validated in scope |
| Composed contrast | 4 — Validated in scope |
| Reduced motion | 4 — Validated in scope |
| Cross-theme technical compatibility | 4 — Validated in scope |
| Cross-theme aesthetic review | 2 — Partial |
| Proof performance evidence | 4 — Validated in scope |
| Production migration | 0 — Not started |
| Final asset library | 0 — Not produced |
| Flonts canonical representation | 0 — Absent |

## 14. Checkpoint

**CYCLE 4 — PROOF LANGUAGE VALIDATED WITH CONSTRAINTS.**

No proof is a final product implementation. No current asset is promoted to final canon.

The next cycle should consolidate the reusable rules proven here and decide which minimal pieces, if any, deserve promotion into the visual system before product migration.
