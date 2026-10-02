import { describe, expect, it } from "vitest";

import type { PracticeItem } from "@/domains/education";
import {
  buildObjectiveEvidenceProjection,
  evaluateRequiredPhrases,
  type ObjectiveEvidenceRecord,
} from "./objective-evidence";

const item: PracticeItem = {
  id: "item-1",
  ownerId: "user-1",
  pageId: "page-1",
  pageTitle: "Fisiologia",
  prompt: "Explique a ideia central.",
  referenceAnswer: "Resposta de referência.",
  explanation: null,
  difficulty: 3,
  assessmentMode: "criterion-referenced",
  criterionPhrases: ["ATP", "contração muscular"],
  criterionVersion: 2,
  minimumObjectiveAttempts: 1,
  active: true,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

const record = (
  id: string,
  state: ObjectiveEvidenceRecord["state"],
  score: number,
  day: string,
  version = 2,
): ObjectiveEvidenceRecord => ({
  id,
  ownerId: "user-1",
  practiceAttemptId: "attempt-" + id,
  practiceItemId: item.id,
  evidenceType: "criterion-referenced",
  state,
  score,
  matchedCriteria: state === "confirmed" ? 2 : 1,
  totalCriteria: 2,
  confidence: state === "confirmed" ? "strong" : state === "developing" ? "partial" : "insufficient",
  criterionVersion: version,
  createdAt: "2026-09-" + day + "T00:00:00.000Z",
});

describe("objective evidence", () => {
  it("uses only explicit required phrases and ignores punctuation/case", () => {
    expect(
      evaluateRequiredPhrases(
        "A CONTRAÇÃO MUSCULAR precisa de ATP.",
        ["ATP", "contração muscular"],
      ),
    ).toMatchObject({
      score: 1,
      matchedCriteria: 2,
      totalCriteria: 2,
      state: "criteria-satisfied",
    });
  });

  it("does not invent a semantic match from a missing criterion", () => {
    expect(
      evaluateRequiredPhrases(
        "A resposta fala de energia e movimento.",
        ["ATP", "contração muscular"],
      ),
    ).toMatchObject({
      matchedCriteria: 0,
      totalCriteria: 2,
      state: "insufficient",
    });
  });

  it("keeps criterion versions isolated", () => {
    const projection = buildObjectiveEvidenceProjection(item, [
      record("old", "confirmed", 1, "29", 1),
      record("current", "developing", 0.5, "30", 2),
    ]);
    expect(projection).toMatchObject({
      state: "developing",
      masteryConfirmed: false,
      criterionVersion: 2,
      evidenceCount: 1,
    });
  });

  it("confirms only the explicit criterion result", () => {
    const projection = buildObjectiveEvidenceProjection(item, [
      record("current", "confirmed", 1, "30", 2),
    ]);
    expect(projection.masteryConfirmed).toBe(false);
    expect(projection.state).toBe("criteria-satisfied");
  });
});
