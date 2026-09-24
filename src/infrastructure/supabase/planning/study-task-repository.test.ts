// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { SupabaseStudyTaskRepository } from "./study-task-repository";

describe("SupabaseStudyTaskRepository", () => {
  it("keeps pending tasks without a due date in upcoming results", async () => {
    const now = "2026-09-24T17:00:00.000Z";
    const builder = {
      select: vi.fn(),
      eq: vi.fn(),
      or: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    };

    const undatedTask = {
      id: "task-undated",
      owner_id: "owner-1",
      title: "Estudar sem prazo",
      due_at: null,
      status: "pending" as const,
      completed_at: null,
      created_at: now,
      updated_at: now,
    };

    const datedTask = {
      id: "task-dated",
      owner_id: "owner-1",
      title: "Estudar amanhã",
      due_at: "2026-09-25T10:00:00.000Z",
      status: "pending" as const,
      completed_at: null,
      created_at: now,
      updated_at: now,
    };

    for (const method of [
      builder.select,
      builder.eq,
      builder.or,
      builder.order,
    ]) {
      method.mockReturnValue(builder);
    }

    builder.limit.mockResolvedValue({
      data: [datedTask, undatedTask],
      error: null,
    });

    const supabase = {
      from: vi.fn().mockReturnValue(builder),
    };

    const repository = new SupabaseStudyTaskRepository(supabase as never);

    const result = await repository.listUpcoming("owner-1", now);

    expect(builder.or).toHaveBeenCalledWith(
      "due_at.gte." + now + ",due_at.is.null",
    );
    expect(result).toHaveLength(2);
    expect(result.map((task) => task.id)).toEqual(["task-dated", "task-undated"]);
    expect(result.find((task) => task.id === "task-undated")?.dueAt).toBeNull();
  });
});
