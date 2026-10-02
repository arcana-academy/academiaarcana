import { describe, expect, it } from "vitest";

import type { PracticeAttempt, PracticeItem } from "@/domains/education";
import {
  buildEducationalStatistics,
  buildEvidenceProjection,
  buildObjectiveEvidenceProjection,
} from "./evidence";

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
  evidenceType: "self-assessment",
  criterion: null,
  criterionVersion: null,
  criterionResult: null,
  criterionScope: null,
  criterionReference: null,
  createdAt: `2026-09-${day}T00:00:00.000Z`,
});

describe("learning evidence", () => {
  it("keeps evidence unknown without evidence", () => {
    expect(buildEvidenceProjection(item, [])).toMatchObject({
      state: "unknown",
      score: null,
      attemptCount: 0,
      confidence: "insufficient",
    });
  });

  it("requires repeated evidence before strong self-reported evidence", () => {
    const attempts = [
      makeAttempt("a1", 1, "strong", "27"),
      makeAttempt("a2", 1, "strong", "28"),
      makeAttempt("a3", 1, "strong", "29"),
    ];
    expect(buildEvidenceProjection(item, attempts)).toMatchObject({
      state: "strong-evidence",
      score: 1,
      attemptCount: 3,
      confidence: "strong",
      source: "self-assessment",
      masteryConfirmed: false,
    });
  });

  it("does not let one strong answer confirm mastery", () => {
    const evidence = buildEvidenceProjection(
      item,
      [makeAttempt("a1", 1, "strong", "29")],
    );
    expect(evidence.state).toBe("developing");
    expect(evidence.masteryConfirmed).toBe(false);
    expect(evidence.source).toBe("self-assessment");
  });

  it("confirms objective mastery only after two passing criterion attempts", () => {
    const objectiveItem = {
      ...item,
      evidenceMode: "criterion_exact_match" as const,
      criterion: "A resposta normalizada deve coincidir exatamente com a referência.",
      criterionVersion: "criterion_exact_match_v1",
      minimumEvidence: 2,
    };
    const attempts = [
      {
        ...makeAttempt("a1", 1, "strong", "28"),
        evidenceType: "criterion-referenced" as const,
        criterion: objectiveItem.criterion,
        criterionVersion: objectiveItem.criterionVersion,
        criterionResult: "pass" as const,
        criterionScope: "practice-item" as const,
        criterionReference: objectiveItem.referenceAnswer,
      },
      {
        ...makeAttempt("a2", 1, "strong", "29"),
        evidenceType: "criterion-referenced" as const,
        criterion: objectiveItem.criterion,
        criterionVersion: objectiveItem.criterionVersion,
        criterionResult: "pass" as const,
        criterionScope: "practice-item" as const,
      },
    ];
    const evidence = buildObjectiveEvidenceProjection(objectiveItem, attempts);
    expect(evidence).toMatchObject({
      state: "confirmed",
      passingAttemptCount: 2,
      minimumEvidence: 2,
      source: "criterion-referenced",
      scope: "practice-item",
      masteryConfirmed: true,
    });
  });

  it("marks recent objective pass/fail evidence as conflicting", () => {
    const objectiveItem = {
      ...item,
      evidenceMode: "criterion_exact_match" as const,
      criterion: "A resposta normalizada deve coincidir exatamente com a referência.",
      criterionVersion: "criterion_exact_match_v1",
      minimumEvidence: 2,
    };
    const attempts = [
      {
        ...makeAttempt("a1", 0, "insufficient", "28"),
        evidenceType: "criterion-referenced" as const,
        criterion: objectiveItem.criterion,
        criterionVersion: objectiveItem.criterionVersion,
        criterionResult: "fail" as const,
        criterionScope: "practice-item" as const,
        criterionReference: objectiveItem.referenceAnswer,
      },
      {
        ...makeAttempt("a2", 1, "strong", "29"),
        evidenceType: "criterion-referenced" as const,
        criterion: objectiveItem.criterion,
        criterionVersion: objectiveItem.criterionVersion,
        criterionResult: "pass" as const,
        criterionScope: "practice-item" as const,
      },
    ];
    expect(buildObjectiveEvidenceProjection(objectiveItem, attempts).state).toBe(
      "conflicting",
    );
  });

  it("does not invent objective evidence for self-assessment activities", () => {
    expect(buildObjectiveEvidenceProjection(item, [])).toMatchObject({
      state: "unknown",
      masteryConfirmed: false,
      criterion: null,
      criterionVersion: null,
    });
  });

  it("keeps objective statistics separate from self-reported statistics", () => {
    const attempts = [
      makeAttempt("a1", 1, "strong", "28"),
      {
        ...makeAttempt("a2", 0, "insufficient", "29"),
        evidenceType: "criterion-referenced" as const,
        criterion: "critério",
        criterionVersion: "criterion_exact_match_v1",
        criterionResult: "fail" as const,
        criterionScope: "practice-item" as const,
      },
    ];
    const evidence = [buildEvidenceProjection(item, attempts)];
    const objectiveEvidence = [buildObjectiveEvidenceProjection(item, attempts)];
    expect(
      buildEducationalStatistics([item], attempts, evidence, objectiveEvidence, 0),
    ).toMatchObject({
      practiceItemCount: 1,
      attemptCount: 2,
      retrievalSuccessRate: 1,
      averageEvidenceScore: 1,
      objectiveAttemptCount: 1,
      objectivePassRate: 0,
      itemsWithStrongSelfReportedEvidence: 0,
      itemsWithConfirmedObjectiveMastery: 0,
    });
  });
});
