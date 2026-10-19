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
  createdAt: `2026-09-${day}T00:00:00.000Z`,
});

describe("adaptive P1 signals", () => {
  it.each(["unknown", "constructor", "toString", "__proto__"])(
    "ignores the persisted outcome %s even when its timestamp is newer",
    (outcome) => {
      const valid = attempt("valid", 0.6, "partial", "20");
      const invalid = {
        ...attempt("invalid", 1, "strong", "21"),
        outcome: outcome as PracticeAttempt["outcome"],
      };
      expect(buildReviewRecommendation(item, [valid, invalid], new Date("2026-09-24T00:00:00Z")))
        .toMatchObject({ due: true, nextReviewAt: "2026-09-23T00:00:00.000Z" });
      expect(buildReviewRecommendation(item, [invalid]))
        .toMatchObject({ due: false, nextReviewAt: null });
    },
  );

  it("orders valid timestamps by instant across different UTC offsets without mutating attempts", () => {
    const attempts = [
      { ...attempt("earlier", 1, "strong", "21"), createdAt: "2026-09-21T01:00:00Z" },
      { ...attempt("later", 0.2, "insufficient", "20"), createdAt: "2026-09-20T23:00:00-03:00" },
    ];
    const original = structuredClone(attempts);
    expect(buildReviewRecommendation(item, attempts, new Date("2026-09-22T02:00:00Z")))
      .toMatchObject({ due: true, nextReviewAt: "2026-09-22T02:00:00.000Z" });
    expect(attempts).toEqual(original);
  });

  it.each([
    ["strong", "2026-10-07T23:30:00.000Z"],
    ["partial", "2026-10-03T23:30:00.000Z"],
    ["insufficient", "2026-10-01T23:30:00.000Z"],
  ] as const)("preserves the %s interval and exact due boundary after filtering invalid evidence", (outcome, nextReviewAt) => {
    const attempts = [
      { ...attempt("valid", 0.6, outcome, "30"), createdAt: "2026-09-30T23:30:00Z" },
      { ...attempt("invalid", 1, "strong", "30"), createdAt: "invalid" },
    ];
    const boundary = Date.parse(nextReviewAt);
    expect(buildReviewRecommendation(item, attempts, new Date(boundary - 1)))
      .toMatchObject({ nextReviewAt, due: false });
    expect(buildReviewRecommendation(item, attempts, new Date(boundary)))
      .toMatchObject({ nextReviewAt, due: true });
  });

  it("distinguishes absent evidence from an unusable persisted timestamp", () => {
    const empty = buildReviewRecommendation(item, []);
    const invalid = buildReviewRecommendation(item, [{ ...attempt("bad", 1, "strong", "20"), createdAt: "" }]);
    expect(empty).toMatchObject({ due: false, nextReviewAt: null });
    expect(empty.reason).toContain("Ainda não há evidência");
    expect(invalid.reason).toContain("inválidas");
  });

  it("schedules review from the latest recovery result", () => {
    const review = buildReviewRecommendation(
      item,
      [attempt("a1", 0.6, "partial", "25")],
      new Date("2026-09-28T00:00:00.000Z"),
    );
    expect(review).toMatchObject({
      practiceItemId: item.id,
      pageId: item.pageId,
      due: true,
      nextReviewAt: "2026-09-28T00:00:00.000Z",
    });
  });

  it("keeps criterion-referenced activities eligible for the existing review policy", () => {
    const objectiveItem: PracticeItem = {
      ...item,
      id: "objective-1",
      evidenceMode: "criterion_exact_match",
      criterion: "Correspondência exata normalizada.",
      criterionVersion: "1",
      minimumEvidence: 2,
    };
    const objectiveAttempt: PracticeAttempt = {
      ...attempt("objective-attempt", 1, "strong", "20"),
      practiceItemId: objectiveItem.id,
      evidenceType: "criterion-referenced",
      criterionResult: "pass",
    };

    const review = buildReviewRecommendation(
      objectiveItem,
      [objectiveAttempt],
      new Date("2026-09-28T00:00:00.000Z"),
    );

    expect(review).toMatchObject({
      practiceItemId: "objective-1",
      pageId: "page-1",
      due: true,
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

  it("ignores malformed attempt dates while retaining a valid earlier review", () => {
    const valid = attempt("valid", 0.6, "partial", "20");
    const malformed = {
      ...attempt("bad", 1, "strong", "21"),
      createdAt: "not-a-date",
    };

    expect(
      buildReviewRecommendation(
        item,
        [valid, malformed],
        new Date("2026-09-24T00:00:00.000Z"),
      ),
    ).toMatchObject({
      due: true,
      nextReviewAt: "2026-09-23T00:00:00.000Z",
    });
  });

  it("does not crash or schedule a review when all dates are invalid", () => {
    const malformed = {
      ...attempt("bad", 1, "strong", "21"),
      createdAt: "not-a-date",
    };

    const review = buildReviewRecommendation(item, [malformed]);
    expect(review.due).toBe(false);
    expect(review.nextReviewAt).toBeNull();
  });
});
