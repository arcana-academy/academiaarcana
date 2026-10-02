import { describe, expect, it } from "vitest";

import type { PracticeAttempt, PracticeItem } from "@/domains/education";
import {
  buildEducationalStatistics,
  buildEvidenceProjection,
  buildObjectiveEvidenceOverview,
} from "./evidence";
import type { ObjectiveEvidenceRecord } from "./objective-evidence";

const item: PracticeItem = {
  id: "item-1",
  ownerId: "user-1",
  pageId: "page-1",
  pageTitle: "Fisiologia",
  prompt: "Explique a ideia central.",
  referenceAnswer: "Resposta de referência.",
  explanation: null,
  difficulty: 3,
  assessmentMode: "self-assessment",
  criterionPhrases: [],
  criterionVersion: 1,
  minimumObjectiveAttempts: 1,
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

  it("keeps statistics separate from XP and streak", () => {
    const attempts = [makeAttempt("a1", 1, "strong", "29")];
    const evidence = [buildEvidenceProjection(item, attempts)];
    expect(buildEducationalStatistics([item], attempts, evidence, 0)).toMatchObject({
      practiceItemCount: 1,
      attemptCount: 1,
      retrievalSuccessRate: 1,
      itemsWithStrongSelfReportedEvidence: 0,
      itemsWithConfirmedObjectiveEvidence: 0,
    });
  });

  it("projects objective confirmation separately from self-reported evidence", () => {
    const objectiveItem = {
      ...item,
      assessmentMode: "criterion-referenced" as const,
      criterionPhrases: ["ATP", "contração muscular"],
      minimumObjectiveAttempts: 1,
    };
    const record: ObjectiveEvidenceRecord = {
      id: "objective-1",
      ownerId: "user-1",
      practiceAttemptId: "attempt-1",
      practiceItemId: objectiveItem.id,
      evidenceType: "criterion-referenced",
      state: "criteria-satisfied",
      score: 1,
      matchedCriteria: 2,
      totalCriteria: 2,
      confidence: "strong",
      criterionVersion: 1,
      createdAt: "2026-09-30T00:00:00.000Z",
    };
    const projection = buildObjectiveEvidenceOverview(
      [objectiveItem],
      [record],
    )[0];
    expect(projection).toMatchObject({
      state: "criteria-satisfied",
      masteryConfirmed: false,
      matchedCriteria: 2,
      totalCriteria: 2,
      source: "criterion-referenced",
    });
  });
});
