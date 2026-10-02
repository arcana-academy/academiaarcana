import { describe, expect, it } from "vitest";

import type { PracticeAttempt, PracticeItem } from "@/domains/education";
import { buildEducationalStatistics, buildMasteryProjection } from "./evidence";

const item: PracticeItem = {
  id: "item-1",
  ownerId: "user-1",
  pageId: "page-1",
  pageTitle: "Fisiologia",
  prompt: "Explique a ideia central.",
  referenceAnswer: "Resposta de referência.",
  explanation: null,
  difficulty: 3,
  active: true,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

const makeAttempt = (
  id: string,
  score: number,
  outcome: PracticeAttempt["outcome"],
  day: string,
): PracticeAttempt => ({
  id,
  ownerId: "user-1",
  practiceItemId: "item-1",
  answer: "Resposta.",
  outcome,
  evidenceScore: score,
  confidence: "partial",
  feedback: "Feedback.",
  createdAt: `2026-09-${day}T00:00:00.000Z`,
});

describe("learning evidence", () => {
  it("keeps mastery unknown without evidence", () => {
    expect(buildMasteryProjection(item, [])).toMatchObject({
      state: "unknown",
      score: null,
      attemptCount: 0,
      confidence: "insufficient",
    });
  });

  it("requires repeated evidence before strong mastery", () => {
    const attempts = [
      makeAttempt("a1", 1, "strong", "27"),
      makeAttempt("a2", 1, "strong", "28"),
      makeAttempt("a3", 1, "strong", "29"),
    ];
    expect(buildMasteryProjection(item, attempts)).toMatchObject({
      state: "strong-evidence",
      score: 1,
      attemptCount: 3,
      confidence: "strong",
    });
  });

  it("does not let one strong answer become mastery", () => {
    const mastery = buildMasteryProjection(
      item,
      [makeAttempt("a1", 1, "strong", "29")],
    );
    expect(mastery.state).toBe("developing");
  });

  it("keeps statistics separate from XP and streak", () => {
    const attempts = [makeAttempt("a1", 1, "strong", "29")];
    const mastery = [buildMasteryProjection(item, attempts)];
    expect(buildEducationalStatistics([item], attempts, mastery, 0)).toMatchObject({
      practiceItemCount: 1,
      attemptCount: 1,
      retrievalSuccessRate: 1,
      masteryWithStrongEvidence: 0,
    });
  });
});
