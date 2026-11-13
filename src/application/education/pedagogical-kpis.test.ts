import { describe, expect, it, vi } from "vitest";

import type {
  EducationalPracticeRepository,
  PracticeAttempt,
  PracticeItem,
} from "@/domains/education";
import {
  buildPedagogicalKpis,
  getPedagogicalSnapshot,
} from "./pedagogical-kpis";

const page = { id: "page-1", title: "Frações" };
const item = (id: string, mode: "self_assessment" | "criterion_exact_match", active = true): PracticeItem => ({
  id,
  ownerId: "owner-1",
  pageId: page.id,
  pageTitle: page.title,
  prompt: "Explique.",
  referenceAnswer: "Resposta.",
  explanation: null,
  difficulty: 3,
  active,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  evidenceMode: mode,
  minimumEvidence: 2,
});
const attempt = (
  id: string,
  practiceItemId: string,
  outcome: PracticeAttempt["outcome"],
  score: number,
  type: "self-assessment" | "criterion-referenced" = "self-assessment",
): PracticeAttempt => ({
  id,
  ownerId: "owner-1",
  practiceItemId,
  answer: "Resposta.",
  outcome,
  evidenceScore: score,
  confidence: "partial",
  feedback: "Feedback.",
  createdAt: "2026-01-01T00:00:00Z",
  evidenceType: type,
  criterionResult: type === "criterion-referenced"
    ? outcome === "strong" ? "pass" : "fail"
    : null,
});

const calculate = (
  pages: Array<{ id: string; title: string }>,
  items: PracticeItem[],
  attempts: PracticeAttempt[],
) => {
  return buildPedagogicalKpis(
    pages, items, attempts, "owner-1", new Date("2026-02-01T00:00:00Z"),
  );
};

describe("P01-P06 pedagogical KPIs", () => {
  it("uses null for missing denominators, but zero for a due review count", () => {
    expect(calculate([], [], [])).toMatchObject({
      objectiveConfirmationRate: null,
      practiceCoverageRate: null,
      reviewDueCount: 0,
      strongRetrievalRate: null,
      meanSelfEvidenceScore: null,
      objectiveConflictRate: null,
    });
  });

  it("counts active, visible pages and keeps self-reports separate from objective evidence", () => {
    const items = [item("self", "self_assessment"), item("objective", "criterion_exact_match")];
    const attempts = [
      attempt("a1", "self", "strong", 1),
      attempt("a2", "self", "partial", 0.5),
      attempt("a3", "objective", "strong", 1, "criterion-referenced"),
      attempt("a4", "objective", "strong", 1, "criterion-referenced"),
    ];
    expect(calculate([page], items, attempts)).toMatchObject({
      objectiveConfirmationRate: 1,
      confirmedObjectiveCount: 1,
      objectiveAssessmentCount: 1,
      practiceCoverageRate: 1,
      practicedPageCount: 1,
      eligiblePageCount: 1,
      reviewDueCount: 2,
      strongRetrievalRate: 0.5,
      meanSelfEvidenceScore: 0.75,
      eligibleSelfAttemptCount: 2,
      objectiveConflictRate: 0,
      attemptedObjectiveCount: 1,
    });
  });

  it("excludes inactive, foreign-owner and orphan attempts from the current-item KPIs", () => {
    const items = [item("active", "self_assessment"), item("archived", "self_assessment", false)];
    const attempts = [
      attempt("a1", "active", "partial", 0.6),
      attempt("a2", "archived", "strong", 1),
      attempt("a3", "removed", "strong", 1),
      { ...attempt("a4", "active", "strong", 1), ownerId: "another-owner" },
    ];
    expect(calculate([page], items, attempts)).toMatchObject({
      eligibleSelfAttemptCount: 1,
      strongRetrievalRate: 0,
      meanSelfEvidenceScore: 0.6,
      practiceCoverageRate: 1,
    });
  });

  it("does not invent confirmation from an objective conflict or from no attempts", () => {
    const items = [
      item("conflict", "criterion_exact_match"),
      item("empty", "criterion_exact_match"),
    ];
    const attempts = [
      attempt("a1", "conflict", "strong", 1, "criterion-referenced"),
      attempt("a2", "conflict", "insufficient", 0, "criterion-referenced"),
    ];
    expect(calculate([page], items, attempts)).toMatchObject({
      objectiveConfirmationRate: 0,
      confirmedObjectiveCount: 0,
      objectiveAssessmentCount: 2,
      objectiveConflictRate: 1,
      attemptedObjectiveCount: 1,
      conflictingObjectiveCount: 1,
      strongRetrievalRate: null,
    });
  });

  it("does not count foreign-owner objective evidence as a confirmation", () => {
    const objective = item("objective", "criterion_exact_match");
    const foreignPasses = [
      { ...attempt("foreign-1", "objective", "strong", 1, "criterion-referenced"), ownerId: "other-owner" },
      { ...attempt("foreign-2", "objective", "strong", 1, "criterion-referenced"), ownerId: "other-owner" },
    ];
    expect(calculate([page], [objective], foreignPasses)).toMatchObject({
      objectiveConfirmationRate: 0,
      confirmedObjectiveCount: 0,
      attemptedObjectiveCount: 0,
      objectiveConflictRate: null,
    });
  });

  it("does not expose invisible pages as covered", () => {
    const hidden = { ...item("hidden", "self_assessment"), pageId: "other-page" };
    expect(calculate([page], [hidden], [attempt("hidden-attempt", "hidden", "strong", 1)]))
      .toMatchObject({ eligiblePageCount: 1, practicedPageCount: 0, practiceCoverageRate: 0 });
  });

  it("excludes a foreign-owned active item even when its page is visible", () => {
    const foreign = { ...item("foreign", "criterion_exact_match"), ownerId: "owner-2" };
    const passes = [
      { ...attempt("foreign-1", "foreign", "strong", 1, "criterion-referenced"), ownerId: "owner-2" },
      { ...attempt("foreign-2", "foreign", "strong", 1, "criterion-referenced"), ownerId: "owner-2" },
    ];
    expect(calculate([page], [foreign], passes)).toMatchObject({
      objectiveConfirmationRate: null,
      objectiveAssessmentCount: 0,
      attemptedObjectiveCount: 0,
      objectiveConflictRate: null,
      practiceCoverageRate: 0,
    });
  });

  it("does not let foreign attempts create or suppress P03 due reviews", () => {
    const own = item("own", "self_assessment");
    const ownAttempt = { ...attempt("own-1", "own", "partial", 0.5), createdAt: "2026-01-01T00:00:00Z" };
    const foreign = { ...attempt("foreign-1", "own", "strong", 1),
      ownerId: "owner-2", createdAt: "2026-02-01T00:00:00Z" };
    expect(calculate([page], [own], [ownAttempt, foreign])).toMatchObject({
      reviewDueCount: 1,
      strongRetrievalRate: 0,
      eligibleSelfAttemptCount: 1,
    });
  });

  it("keeps P04/P05 absent when only objective evidence is available", () => {
    const objective = item("obj", "criterion_exact_match");
    expect(calculate([page], [objective], [
      attempt("obj-a", "obj", "strong", 1, "criterion-referenced"),
    ])).toMatchObject({
      strongRetrievalRate: null,
      meanSelfEvidenceScore: null,
      eligibleSelfAttemptCount: 0,
      attemptedObjectiveCount: 1,
    });
  });

  it("reads each source only once and preserves the existing educational projection", async () => {
    const items = [item("active", "self_assessment")];
    const attempts = [attempt("a1", "active", "partial", 0.4)];
    const repository = {
      listPages: vi.fn(() => Promise.resolve([page])),
      listPracticeItems: vi.fn(() => Promise.resolve(items)),
      listPracticeAttempts: vi.fn(() => Promise.resolve(attempts)),
    } as unknown as EducationalPracticeRepository;
    const result = await getPedagogicalSnapshot(repository, "owner-1");
    expect(result.pedagogicalKpis.practiceCoverageRate).toBe(1);
    expect(result.educational.statistics.attemptCount).toBe(1);
    expect(repository.listPages).toHaveBeenCalledTimes(1);
    expect(repository.listPracticeItems).toHaveBeenCalledTimes(1);
    expect(repository.listPracticeAttempts).toHaveBeenCalledTimes(1);
  });
});
