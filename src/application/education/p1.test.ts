import { describe, expect, it } from "vitest";

import type {
  ObjectiveAssessment,
  ObjectiveAttempt,
  PracticeAttempt,
  PracticeItem,
} from "@/domains/education";
import { buildEducationalOverview } from "./p1";

const item: PracticeItem = {
  id: "practice-1",
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

const objective: ObjectiveAssessment = {
  id: "assessment-1",
  ownerId: "user-1",
  pageId: "page-1",
  pageTitle: "Anatomia",
  prompt: "Qual é a resposta?",
  referenceAnswer: "Resposta correta",
  criterion: "Correspondência exata normalizada.",
  scoringPolicy: "normalized-exact-match",
  minimumEvidence: 2,
  validityScope: "page",
  criterionVersion: 1,
  active: true,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

const makeObjectiveAttempt = (
  id: string,
  outcome: ObjectiveAttempt["outcome"],
): ObjectiveAttempt => ({
  id,
  ownerId: "user-1",
  assessmentId: "assessment-1",
  answer: outcome === "pass" ? "Resposta correta" : "Outra",
  outcome,
  evidenceScore: outcome === "pass" ? 1 : 0,
  confidence: "strong",
  feedback: "Feedback.",
  criterionVersion: 1,
  createdAt: "2026-10-02T00:00:00.000Z",
});

describe("educational overview", () => {
  it("aggregates criterion-referenced evidence without changing self-assessment semantics", () => {
    const attempt: PracticeAttempt = {
      id: "practice-attempt-1",
      ownerId: "user-1",
      practiceItemId: item.id,
      answer: "Resposta",
      outcome: "strong",
      evidenceScore: 1,
      confidence: "partial",
      feedback: "Feedback.",
      createdAt: "2026-10-02T00:00:00.000Z",
    };

    const overview = buildEducationalOverview(
      [{ id: "page-1", title: "Anatomia" }],
      [item],
      [attempt],
      new Date("2026-10-02T00:00:00.000Z"),
      [objective],
      [
        makeObjectiveAttempt("objective-1", "pass"),
        makeObjectiveAttempt("objective-2", "pass"),
      ],
    );

    expect(overview.evidence[0]?.masteryConfirmed).toBe(false);
    expect(overview.objectiveEvidence[0]).toMatchObject({
      state: "confirmed",
      masteryConfirmed: true,
      passingAttemptCount: 2,
    });
    expect(overview.statistics.objectiveConfirmedCount).toBe(1);
  });
});
