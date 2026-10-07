import { describe, expect, test } from "vitest";

import { PROOF_IDS, proofRegistry } from "./proof-registry";

describe("Phase 2 proof registry", () => {
  test("contains exactly the four approved proof identifiers", () => {
    expect(PROOF_IDS).toEqual([
      "AA-PROOF-001",
      "AA-PROOF-002",
      "AA-PROOF-003",
      "AA-PROOF-004",
    ]);
    expect(proofRegistry).toHaveLength(4);
  });

  test("proofs remain experimental and do not claim final asset status", () => {
    for (const proof of proofRegistry) {
      expect(proof.id).toMatch(/^AA-PROOF-\d{3}$/);
      expect(proof.verdict).toBe("EXPERIMENTAL");
      expect(proof.currentAsset ?? "").not.toMatch(/^AA-PROOF-/);
    }
  });

  test("proof set covers M0-M3 and D0-D3 once each as its primary regime", () => {
    expect(proofRegistry.map((proof) => proof.material)).toEqual(["M0", "M1", "M2", "M3"]);
    expect(proofRegistry.map((proof) => proof.density)).toEqual(["D0", "D1", "D2", "D3"]);
  });
});
