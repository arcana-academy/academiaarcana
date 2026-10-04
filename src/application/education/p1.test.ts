import { describe, expect, it } from "vitest";

import type { PracticeAttempt, PracticeItem } from "@/domains/education";
import { buildEducationalOverview } from "./p1";

const selfItem: PracticeItem = {
  id: "self-item-1",
  ownerId: "user-1",
  pageId: "page-1",
  pageTitle: "Anatomia",
  prompt: "Explique.",
  referenceAnswer: "Resposta.",
  explanation: null,
  difficulty: 3,
  active: true,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

const objectiveItem: PracticeItem = {
  ...selfItem,
  id: "objective-item-1",
  prompt: "Qual é a resposta objetiva?",
  referenceAnswer: "Resposta correta",
  evidenceMode: "criterion_exact_match",
  criterion:
    "A resposta deve corresponder à resposta de referência após normalização de caixa e espaços.",
  criterionVersion: "1",
  minimumEvidence: 2,
};

const selfAssessment: PracticeAttempt = {
  id: "self-attempt-1",
  ownerId: "user-1",
  practiceItemId: selfItem.id,
  answer: "Resposta",
  outcome: "strong",
  evidenceScore: 1,
  confidence: "partial",
  feedback: "Feedback.",
  createdAt: "2026-10-02T00:00:00.000Z",
  evidenceType: "self-assessment",
};

const objectiveAttempt = (id: string): PracticeAttempt => ({
  id,
  ownerId: "user-1",
  practiceItemId: objectiveItem.id,
  answer: "Resposta correta",
  outcome: "strong",
  evidenceScore: 1,
  confidence: "strong",
  feedback: "Feedback objetivo.",
  createdAt: "2026-10-02T00:00:00.000Z",
  evidenceType: "criterion-referenced",
  criterion: objectiveItem.criterion,
  criterionVersion: "1",
  criterionResult: "pass",
  criterionScope: "practice-item",
  criterionReference: objectiveItem.referenceAnswer,
});

describe("educational overview", () => {
  it("keeps objective evidence separate from self-reported evidence", () => {
    const overview = buildEducationalOverview(
      [{ id: "page-1", title: "Anatomia" }],
      [selfItem, objectiveItem],
      [
        selfAssessment,
        objectiveAttempt("objective-1"),
        objectiveAttempt("objective-2"),
      ],
      new Date("2026-10-02T00:00:00.000Z"),
    );

    expect(overview.evidence).toHaveLength(1);
    expect(overview.evidence[0]?.masteryConfirmed).toBe(false);

    expect(overview.objectiveEvidence).toHaveLength(1);
    expect(overview.objectiveEvidence[0]).toMatchObject({
      practiceItemId: objectiveItem.id,
      state: "confirmed",
      masteryConfirmed: true,
      passingAttemptCount: 2,
    });

    expect(overview.statistics.attemptCount).toBe(1);
    expect(overview.statistics.objectiveAttemptCount).toBe(2);
    expect(overview.statistics.objectiveConfirmedCount).toBe(1);
  });
});
