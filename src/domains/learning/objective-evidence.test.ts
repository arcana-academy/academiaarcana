import { describe, expect, it } from "vitest";

import type { PracticeAttempt, PracticeItem } from "@/domains/education";
import { buildObjectiveEvidenceProjection } from "./objective-evidence";

const item: PracticeItem = {
  id: "item-1",
  ownerId: "user-1",
  pageId: "page-1",
  pageTitle: "Anatomia",
  prompt: "Qual é a resposta?",
  referenceAnswer: "Resposta correta",
  explanation: null,
  difficulty: 3,
  active: true,
  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
  evidenceMode: "criterion_exact_match",
  criterion:
    "A resposta deve corresponder à resposta de referência após normalização de caixa e espaços.",
  criterionVersion: "1",
  minimumEvidence: 2,
};

const attempt = (
  id: string,
  result: "pass" | "fail",
): PracticeAttempt => ({
  id,
  ownerId: "user-1",
  practiceItemId: item.id,
  answer: result === "pass" ? "Resposta correta" : "Outra",
  outcome: result === "pass" ? "strong" : "insufficient",
  evidenceScore: result === "pass" ? 1 : 0,
  confidence: "strong",
  feedback: "Feedback.",
  createdAt: "2026-10-02T00:00:00.000Z",
  evidenceType: "criterion-referenced",
  criterion: item.criterion,
  criterionVersion: "1",
  criterionResult: result,
  criterionScope: "practice-item",
  criterionReference: item.referenceAnswer,
  it("surfaces conflicting evidence instead of confirming mastery", () => {
    expect(
      buildObjectiveEvidenceProjection(item, [
        attempt("a1", "pass"),
        attempt("a2", "fail"),
      ]),
    ).toMatchObject({
      state: "conflicting",
      passingAttemptCount: 1,
      masteryConfirmed: false,
    });
  });

});

describe("criterion-referenced evidence projection", () => {
  it("stays unknown without objective attempts", () => {
    expect(buildObjectiveEvidenceProjection(item, [])).toMatchObject({
      state: "unknown",
      score: null,
      attemptCount: 0,
      masteryConfirmed: false,
      source: "criterion-referenced",
    });
  });

  it("requires the declared minimum objective evidence", () => {
    expect(
      buildObjectiveEvidenceProjection(item, [attempt("a1", "pass")]),
    ).toMatchObject({
      state: "developing",
      passingAttemptCount: 1,
      masteryConfirmed: false,
    });

    expect(
      buildObjectiveEvidenceProjection(item, [
        attempt("a1", "pass"),
        attempt("a2", "pass"),
      ]),
    ).toMatchObject({
      state: "confirmed",
      passingAttemptCount: 2,
      masteryConfirmed: true,
      validityScope: "practice-item",
    });
  });

  it("does not confirm mastery from failures", () => {
    expect(
      buildObjectiveEvidenceProjection(item, [
        attempt("a1", "fail"),
        attempt("a2", "fail"),
      ]),
    ).toMatchObject({
      state: "insufficient",
      masteryConfirmed: false,
    });
  });

  it("ignores self-assessment attempts when projecting objective evidence", () => {
    const selfAssessment: PracticeAttempt = {
      ...attempt("self-1", "fail"),
      evidenceType: "self-assessment",
      criterionResult: null,
      criterionScope: null,
      criterionReference: null,
    };

    expect(
      buildObjectiveEvidenceProjection(item, [
        selfAssessment,
        attempt("objective-1", "pass"),
      ]),
    ).toMatchObject({
      state: "developing",
      attemptCount: 1,
      passingAttemptCount: 1,
      masteryConfirmed: false,
    });
  });
});
