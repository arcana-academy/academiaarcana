export const PROOF_IDS = [
  "AA-PROOF-001",
  "AA-PROOF-002",
  "AA-PROOF-003",
  "AA-PROOF-004",
] as const;

export type ProofId = (typeof PROOF_IDS)[number];
export type ProofVerdict = "EXPERIMENTAL" | "APPROVED" | "APPROVED_WITH_CONSTRAINT" | "ITERATE" | "REJECT" | "INCONCLUSIVE";

export type ProofDefinition = {
  id: ProofId;
  title: string;
  regime: string;
  material: "M0" | "M1" | "M2" | "M3";
  texture: string;
  density: "D0" | "D1" | "D2" | "D3";
  light: readonly string[];
  currentSource: string;
  currentAsset?: string;
  verdict: ProofVerdict;
  constraint: string;
};

export const proofRegistry: readonly ProofDefinition[] = [
  {
    id: "AA-PROOF-001",
    title: "Foco — silêncio operacional",
    regime: "functional",
    material: "M0",
    texture: "T0",
    density: "D0",
    light: ["functional", "activation"],
    currentSource: "src/components/foco/FocusSession.tsx",
    currentAsset: "AA-ASSET-006",
    verdict: "APPROVED_WITH_CONSTRAINT",
    constraint: "Activation remains subtle and non-reward; Focus meaning cannot depend on motion or the legacy sigil.",
  },
  {
    id: "AA-PROOF-002",
    title: "Grimórios — materialidade acadêmica",
    regime: "academic",
    material: "M1",
    texture: "T1/T2",
    density: "D1",
    light: ["ambient"],
    currentSource: "src/app/grimorios/page.tsx",
    currentAsset: "AA-ASSET-003",
    verdict: "APPROVED_WITH_CONSTRAINT",
    constraint: "T2 remains localized to the world object; AA-ASSET-003 remains legacy and is not final material canon.",
  },
  {
    id: "AA-PROOF-003",
    title: "Santuário — arcano habitável",
    regime: "arcane",
    material: "M2",
    texture: "T2/T3",
    density: "D2",
    light: ["ambient", "transformation-conditional"],
    currentSource: "src/components/sanctuary/SanctuaryHeader.tsx",
    currentAsset: "AA-ASSET-002",
    verdict: "APPROVED_WITH_CONSTRAINT",
    constraint: "T3 stays peripheral and removable on mobile; AA-ASSET-002 remains a decorative legacy sigil.",
  },
  {
    id: "AA-PROOF-004",
    title: "Conquista excepcional — ritual transitório",
    regime: "ritual",
    material: "M3",
    texture: "T3/T4",
    density: "D3",
    light: ["transformation", "reward"],
    currentSource: "src/app/conquistas/page.tsx",
    currentAsset: "AA-ASSET-005",
    verdict: "APPROVED_WITH_CONSTRAINT",
    constraint: "M3 is transient; this proof validates peak composition, not production state choreography or final AA-ASSET-005 geometry.",
  },
] as const;
