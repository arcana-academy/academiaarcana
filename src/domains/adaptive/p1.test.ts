import { describe, expect, it } from "vitest";

import type { PracticeAttempt, PracticeItem } from "@/domains/education";
import { buildEducationalProfile, buildLearningGapSignal, buildReviewRecommendation } from "./p1";

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
  evidenceMode: "self_assessment",
  criterion: null,
  criterionVersion: null,
  minimumEvidence: 2,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

const attempt = (
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
  evidenceType: "self-assessment",
  criterion: null,
  criterionVersion: null,
  criterionResult: null,
  criterionScope: null,
  createdAt: `2026-09-${day}T00:00:00.000Z`,
});

describe("adaptive P1 signals", () => {
  it("schedules review from the latest recovery result", () => {
    const review = buildReviewRecommendation(
      item,
      [attempt("a1", 0.6, "partial", "25")],
      new Date("2026-09-28T00:00:00.000Z"),
    );
    expect(review).toMatchObject({
      due: true,
      nextReviewAt: "2026-09-28T00:00:00.000Z",
    });
  });

  it("does not emit a gap signal from a single attempt", () => {
    expect(
      buildLearningGapSignal(item, [attempt("a1", 0.2, "insufficient", "29")]),
    ).toBeNull();
  });

  it("emits a revisable gap signal from repeated low evidence", () => {
    const gap = buildLearningGapSignal(item, [
      attempt("a1", 0.2, "insufficient", "29"),
      attempt("a2", 0.2, "insufficient", "30"),
    ]);
    expect(gap?.reason).toContain("não é um diagnóstico");
  });

  it("distinguishes no data from weak evidence in the educational profile", () => {
    const profile = buildEducationalProfile(2, [item], [], []);
    expect(profile.practiceCoverage).toMatchObject({
      value: 0,
      confidence: "insufficient",
    });
    expect(profile.retrievalPerformance).toMatchObject({
      value: 0,
      confidence: "insufficient",
    });
  });
});
