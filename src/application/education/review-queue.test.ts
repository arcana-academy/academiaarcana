import { describe, expect, it } from "vitest";
import type { PracticeAttempt, PracticeItem } from "@/domains/education";
import { buildLearnerReviewQueue } from "./review-queue";

const pages = [{ id: "page 1", title: "Anatomia" }, { id: "page-2", title: "Fisiologia" }];
const item = (id: string, pageId = "page 1", ownerId = "user-1"): PracticeItem => ({
  id,
  ownerId,
  pageId,
  pageTitle: "Título armazenado anteriormente",
  prompt: `Recupere ${id} sem consultar`,
  referenceAnswer: "Resposta secreta",
  explanation: null,
  difficulty: 3,
  active: true,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
});
const attempt = (
  id: string,
  practiceItemId: string,
  createdAt: string,
  outcome: PracticeAttempt["outcome"] = "partial",
  ownerId = "user-1",
): PracticeAttempt => ({
  id,
  ownerId,
  practiceItemId,
  answer: "Recuperação de exemplo",
  outcome,
  evidenceScore: 0.5,
  confidence: "partial",
  feedback: "Continue estudando",
  createdAt,
});

const now = new Date("2026-10-13T12:00:00.000Z");

describe("buildLearnerReviewQueue", () => {
  it("does not invent reviews before any successful attempt", () => {
    expect(buildLearnerReviewQueue("user-1", pages, [item("a")], [], now)).toEqual({
      due: [],
      upcoming: [],
    });
  });

  it("prioritizes due reviews and sorts by the persisted review instant", () => {
    const items = [item("later"), item("first"), item("future", "page-2")];
    const attempts = [
      attempt("1", "later", "2026-10-10T08:00:00.000Z"),
      attempt("2", "first", "2026-10-08T08:00:00.000Z"),
      attempt("3", "future", "2026-10-12T08:00:00.000Z", "strong"),
    ];
    const result = buildLearnerReviewQueue("user-1", pages, items, attempts, now);
    expect(result.due.map((entry) => entry.practiceItemId)).toEqual(["first", "later"]);
    expect(result.upcoming.map((entry) => entry.practiceItemId)).toEqual(["future"]);
    expect(result.due[0]?.pageTitle).toBe("Anatomia");
    expect(result.due[0]?.reason).toContain("recuperação foi parcial");
  });

  it("uses the safe canonical objective selector and encodes identifiers", () => {
    const objective = { ...item("objective&1"), evidenceMode: "criterion_exact_match" as const };
    const result = buildLearnerReviewQueue(
      "user-1",
      pages,
      [objective],
      [attempt("a", "objective&1", "2026-10-10T08:00:00.000Z", "insufficient")],
      now,
    );
    expect(result.due[0]?.href).toBe(
      "/pratica?pagina=page%201&avaliacao=objective%261",
    );
    expect(JSON.stringify(result)).not.toContain("Resposta secreta");
    expect(JSON.stringify(result)).not.toContain("Recuperação de exemplo");
  });

  it("rejects foreign, inactive, orphaned and foreign-attempt records", () => {
    const disabled = { ...item("disabled"), active: false };
    const records = [
      item("safe"),
      item("foreign", "page 1", "user-2"),
      item("orphan", "unknown"),
      disabled,
    ];
    const result = buildLearnerReviewQueue("user-1", pages, records, [
      attempt("1", "safe", "2026-10-01T08:00:00.000Z", "partial", "user-2"),
      attempt("2", "foreign", "2026-10-01T08:00:00.000Z"),
      attempt("3", "orphan", "2026-10-01T08:00:00.000Z"),
      attempt("4", "disabled", "2026-10-01T08:00:00.000Z"),
    ], now);
    expect(result).toEqual({ due: [], upcoming: [] });
  });

  it("updates suggestions from the latest attempt without persisting a task", () => {
    const result = buildLearnerReviewQueue("user-1", pages, [item("a")], [
      attempt("older", "a", "2026-10-01T08:00:00.000Z", "insufficient"),
      attempt("newer", "a", "2026-10-12T08:00:00.000Z", "strong"),
    ], now);
    expect(result.due).toHaveLength(0);
    expect(result.upcoming[0]?.nextReviewAt).toBe("2026-10-19T08:00:00.000Z");
  });
});
