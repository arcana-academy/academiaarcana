import { describe, expect, it, vi } from "vitest";

import { SupabaseEducationalPracticeRepository } from "./education/practice-repository";
import { SupabasePageProgressRepository } from "./learning/page-progress-repository";
import { SupabaseStudyTaskRepository } from "./planning/study-task-repository";

function createQuery(result: {
  data: unknown;
  error: { message: string } | null;
}) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => result),
    single: vi.fn(async () => result),
    then: (
      resolve: (
        value: { data: unknown; error: { message: string } | null },
      ) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };

  return builder;
}

describe("Supabase persistence error propagation", () => {
  it("propagates page-progress database errors", async () => {
    const query = createQuery({
      data: null,
      error: { message: "page progress failed" },
    });
    const supabase = {
      from: vi.fn(() => query),
    };

    const repository = new SupabasePageProgressRepository(supabase as never);

    await expect(
      repository.setStatus("user-1", "page-1", "completed", "2026-10-03T12:00:00.000Z"),
    ).rejects.toThrow("page progress failed");
  });

  it("propagates study-task database errors", async () => {
    const query = createQuery({
      data: null,
      error: { message: "study task failed" },
    });
    const supabase = {
      from: vi.fn(() => query),
    };

    const repository = new SupabaseStudyTaskRepository(supabase as never);

    await expect(repository.getById("task-1")).rejects.toThrow(
      "study task failed",
    );
  });

  it("propagates educational-practice RPC errors", async () => {
    const supabase = {
      rpc: vi.fn(async () => ({
        data: null,
        error: { message: "practice rpc failed" },
      })),
    };

    const repository = new SupabaseEducationalPracticeRepository(
      supabase as never,
    );

    await expect(
      repository.recordPracticeAttemptAndProgress({
        ownerId: "user-1",
        practiceItemId: "practice-1",
        answer: "answer",
        outcome: "completed",
        evidenceScore: 2,
        confidence: "high",
        feedback: "feedback",
      }),
    ).rejects.toThrow("practice rpc failed");
  });
});
