import { describe, expect, it } from "vitest";

import {
  evaluateObjectiveExactMatch,
  normalizeObjectiveAnswer,
} from "./objective";

describe("objective evidence", () => {
  it("normalizes case and repeated whitespace", () => {
    expect(normalizeObjectiveAnswer("  Resposta   Correta ")).toBe(
      "resposta correta",
    );
  });

  it("passes a normalized exact match", () => {
    expect(
      evaluateObjectiveExactMatch(
        "  Resposta   Correta ",
        "resposta correta",
        "normalized-exact-match",
      ),
    ).toMatchObject({
      outcome: "strong",
      evidenceScore: 1,
      confidence: "strong",
      criterionResult: "pass",
    });
  });

  it("fails a non-matching answer without weakening determinism", () => {
    expect(
      evaluateObjectiveExactMatch(
        "Outra resposta",
        "resposta correta",
        "normalized-exact-match",
      ),
    ).toMatchObject({
      outcome: "insufficient",
      evidenceScore: 0,
      confidence: "strong",
      criterionResult: "fail",
    });
  });
});
