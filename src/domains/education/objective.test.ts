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
      outcome: "pass",
      evidenceScore: 1,
      confidence: "strong",
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
      outcome: "fail",
      evidenceScore: 0,
      confidence: "strong",
    });
  });
});
