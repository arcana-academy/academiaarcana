import { describe, expect, it } from "vitest";

import { buildAttemptInput } from "./p1";

describe("education retrieval feedback", () => {
  it("maps a strong self-assessment to explicit evidence without treating it as mastery", () => {
    expect(
      buildAttemptInput({
        practiceItemId: "item-1",
        answer: "  Minha resposta. ",
        outcome: "strong",
      }),
    ).toMatchObject({
      practiceItemId: "item-1",
      answer: "Minha resposta.",
      outcome: "strong",
      evidenceScore: 1,
      confidence: "partial",
    });
  });

  it("keeps insufficient recovery non-punitive and action-oriented", () => {
    expect(
      buildAttemptInput({
        practiceItemId: "item-1",
        answer: "Não lembrei.",
        outcome: "insufficient",
      }).feedback,
    ).toContain("não é um diagnóstico");
  });
});
