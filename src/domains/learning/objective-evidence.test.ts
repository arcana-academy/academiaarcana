import { describe, expect, it } from "vitest";

import type {
  ObjectiveAssessment,
  ObjectiveAttempt,
} from "@/domains/education";
import { buildObjectiveEvidenceProjection } from "./objective-evidence";

const assessment: ObjectiveAssessment = {
  id: "assessment-1",
  ownerId: "user-1",
  pageId: "page-1",
  pageTitle: "Anatomia",
  prompt: "Qual é a resposta?",
  referenceAnswer: "Resposta correta",
  criterion:
    "A resposta deve corresponder à referência após normalização de caixa e espaços.",
  scoringPolicy: "normalized-exact-match",
  minimumEvidence: 2,
  validityScope: "page",
  criterionVersion: 1,
  active: true,
  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
};

const attempt = (
  id: string,
  outcome: ObjectiveAttempt["outcome"],
): ObjectiveAttempt => ({
  id,
  ownerId: "user-1",
  assessmentId: "assessment-1",
  answer: "Resposta correta",
  outcome,
  evidenceScore: outcome === "pass" ? 1 : 0,
  confidence: "strong",
  feedback: "Feedback.",
  criterionVersion: 1,
  createdAt: "2026-10-02T00:00:00.000Z",
});

describe("criterion-referenced evidence projection", () => {
  it("stays unknown without attempts", () => {
    expect(buildObjectiveEvidenceProjection(assessment, [])).toMatchObject({
      state: "unknown",
      score: null,
      attemptCount: 0,
      masteryConfirmed: false,
    });
  });

  it("requires the declared minimum evidence", () => {
    const one = buildObjectiveEvidenceProjection(assessment, [
      attempt("a1", "pass"),
    ]);
    expect(one).toMatchObject({
      state: "developing",
      passingAttemptCount: 1,
      masteryConfirmed: false,
    });

    const two = buildObjectiveEvidenceProjection(assessment, [
      attempt("a1", "pass"),
      attempt("a2", "pass"),
    ]);
    expect(two).toMatchObject({
      state: "confirmed",
      passingAttemptCount: 2,
      masteryConfirmed: true,
      source: "criterion-referenced",
    });
  });

  it("does not confirm mastery from failures", () => {
    expect(
      buildObjectiveEvidenceProjection(assessment, [
        attempt("a1", "fail"),
        attempt("a2", "fail"),
      ]),
    ).toMatchObject({
      state: "insufficient",
      masteryConfirmed: false,
    });
  });
});
