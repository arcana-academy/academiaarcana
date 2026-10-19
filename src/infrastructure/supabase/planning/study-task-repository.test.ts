// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { SupabaseStudyTaskRepository } from "./study-task-repository";

describe("SupabaseStudyTaskRepository", () => {
  it.each([[], null])("returns an empty schedule for successful empty data %j", async (data) => {
    const builder = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn() };
    for (const method of [builder.select, builder.eq, builder.order]) method.mockReturnValue(builder);
    builder.limit.mockResolvedValue({ data, error: null });
    const repository = new SupabaseStudyTaskRepository({ from: vi.fn().mockReturnValue(builder) } as never);

    expect(await repository.listUpcoming("owner-1", "2026-10-16T17:00:00Z", 3)).toEqual([]);
    expect(builder.limit).toHaveBeenCalledWith(3);
    expect(builder.eq.mock.calls).toEqual([["owner_id", "owner-1"], ["status", "pending"]]);
  });

  it("keeps overdue, future and undated pending tasks actionable", async () => {
    const now = "2026-10-16T17:00:00.000Z";
    const builder = {
      select: vi.fn(),
      eq: vi.fn(),
      or: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    };

    for (const method of [builder.select, builder.eq, builder.order]) {
      method.mockReturnValue(builder);
    }

    const row = (id: string, dueAt: string | null) => ({
      id,
      owner_id: "owner-1",
      title: id,
      due_at: dueAt,
      status: "pending" as const,
      completed_at: null,
      created_at: now,
      updated_at: now,
    });

    builder.limit.mockResolvedValue({
      data: [
        row("task-overdue", "2026-10-15T10:00:00.000Z"),
        row("task-future", "2026-10-17T10:00:00.000Z"),
        row("task-undated", null),
      ],
      error: null,
    });

    const supabase = { from: vi.fn().mockReturnValue(builder) };
    const repository = new SupabaseStudyTaskRepository(supabase as never);
    const result = await repository.listUpcoming("owner-1", now);

    expect(supabase.from).toHaveBeenCalledWith("study_tasks");
    expect(builder.eq).toHaveBeenCalledWith("owner_id", "owner-1");
    expect(builder.eq).toHaveBeenCalledWith("status", "pending");
    expect(builder.or).not.toHaveBeenCalled();
    expect(builder.order).toHaveBeenCalledWith("due_at", {
      ascending: true,
      nullsFirst: false,
    });
    expect(builder.limit).toHaveBeenCalledWith(10);
    expect(result.map((task) => task.id)).toEqual([
      "task-overdue",
      "task-future",
      "task-undated",
    ]);
    expect(result.find((task) => task.id === "task-undated")?.dueAt).toBeNull();
  });

  it("propagates read errors instead of displaying a false empty schedule", async () => {
    const builder = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    };
    for (const method of [builder.select, builder.eq, builder.order]) {
      method.mockReturnValue(builder);
    }
    builder.limit.mockResolvedValue({
      data: null,
      error: { message: "synthetic read failure" },
    });
    const repository = new SupabaseStudyTaskRepository({
      from: vi.fn().mockReturnValue(builder),
    } as never);
    await expect(repository.listUpcoming("owner-1", "2026-10-16T17:00:00Z"))
      .rejects.toThrow("synthetic read failure");
  });
});
