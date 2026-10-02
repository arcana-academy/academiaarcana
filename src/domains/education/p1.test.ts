import { describe, expect, it } from "vitest";

import { buildEducationalOverview } from "./p1";
import type { PracticeAttempt, PracticeItem } from "./contracts";

const item: PracticeItem = {
  id: "item-1",
  ownerId: "user-1",
  pageId: "page-1",
  pageTitle: "Fisiologia",
  prompt: "Explique a ideia central.",
  referenceAnswer: "Resposta de referência.",
  explanation: "Revise a relação principal.",
  difficulty: 3,
  active: true,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

function attempt(
  id: string,
  score: number,
  outcome: PracticeAttempt["outcome"],
  createdAt: string,
): PracticeAttempt {
  return {
    id,
    ownerId: "user-1",
    practiceItemId: "item-1",
    answer: "Minha resposta.",
    outcome,
    evidenceScore: score,
    confidence: "partial",
    feedback: "Feedback.",
    createdAt,
  };
}

describe("P1 educational projections", () => {
  it("keeps domain unknown when there is no evidence", () => {
    const overview = buildEducationalOverview(
      [{ id: "page-1", title: "Fisiologia" }],
      [item],
      [],
      new Date("2026-10-01T00:00:00.000Z"),
    );

    expect(overview.mastery[0]).toMatchObject({
      state: "unknown",
      score: null,
      attemptCount: 0,
      confidence: "insufficient",
    });
    expect(overview.reviews[0]?.nextReviewAt).toBeNull();
  });

  it("creates a review recommendation from the latest outcome instead of a fixed date", () => {
    const overview = buildEducationalOverview(
      [{ id: "page-1", title: "Fisiologia" }],
      [item],
      [attempt("a1", 0.6, "partial", "2026-09-25T00:00:00.000Z")],
      new Date("2026-09-28T00:00:00.000Z"),
    );

    expect(overview.reviews[0]).toMatchObject({
      due: true,
      nextReviewAt: "2026-09-28T00:00:00.000Z",
    });
  });

  it("only produces a learning-gap signal with enough recent evidence", () => {
    const overview = buildEducationalOverview(
      [{ id: "page-1", title: "Fisiologia" }],
      [item],
      [
        attempt("a1", 0.2, "insufficient", "2026-09-29T00:00:00.000Z"),
        attempt("a2", 0.2, "insufficient", "2026-09-30T00:00:00.000Z"),
      ],
      new Date("2026-10-01T00:00:00.000Z"),
    );

    expect(overview.learningGaps).toHaveLength(1);
    expect(overview.learningGaps[0]?.reason).toContain("não é um diagnóstico");
  });

  it("does not treat XP or activity as mastery evidence", () => {
    const overview = buildEducationalOverview(
      [{ id: "page-1", title: "Fisiologia" }],
      [item],
      [attempt("a1", 1, "strong", "2026-09-30T00:00:00.000Z")],
      new Date("2026-10-01T00:00:00.000Z"),
    );

    expect(overview.statistics.masteryWithStrongEvidence).toBe(0);
    expect(overview.mastery[0]?.state).not.toBe("strong-evidence");
    expect(overview.profile.retrievalPerformance.value).toBe(100);
  });
});
