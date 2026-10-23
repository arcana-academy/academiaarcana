// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import { SupabaseStudyTaskRepository } from "./study-task-repository";

const now = "2026-10-19T12:00:00.000Z";
function row(id: string, dueAt: string | null) {
  return {
    id, owner_id: "owner-synthetic", title: id, due_at: dueAt,
    status: "pending" as const, completed_at: null, created_at: now, updated_at: now,
  };
}
function query(data: ReturnType<typeof row>[] | null, error: { message: string } | null = null) {
  const builder = {
    select: vi.fn(), eq: vi.fn(), or: vi.fn(), lt: vi.fn(), order: vi.fn(),
    limit: vi.fn().mockResolvedValue({ data, error }),
  };
  for (const method of [builder.select, builder.eq, builder.or, builder.lt, builder.order]) {
    method.mockReturnValue(builder);
  }
  return builder;
}

describe("SupabaseStudyTaskRepository", () => {
  it.each([null, []])("returns a genuine empty upcoming list with %s query data", async (data) => {
    const builder = query(data);
    const from = vi.fn().mockReturnValue(builder);
    const repository = new SupabaseStudyTaskRepository({ from } as never);
    expect(await repository.listUpcoming("owner-synthetic", now, 3)).toEqual([]);
    expect(from).toHaveBeenCalledWith("study_tasks");
    expect(builder.eq.mock.calls).toEqual([
      ["owner_id", "owner-synthetic"], ["status", "pending"],
    ]);
    expect(builder.or).toHaveBeenCalledWith(`due_at.gte.${now},due_at.is.null`);
    expect(builder.limit).toHaveBeenCalledWith(3);
  });

  it("keeps upcoming semantics temporal for Sanctuary and Mestre Arcano", async () => {
    const builder = query([
      row("future", "2026-10-20T10:00:00.000Z"), row("undated", null),
    ]);
    const repository = new SupabaseStudyTaskRepository({
      from: vi.fn().mockReturnValue(builder),
    } as never);
    expect((await repository.listUpcoming("owner-synthetic", now)).map((task) => task.id))
      .toEqual(["future", "undated"]);
    expect(builder.or).toHaveBeenCalledWith(`due_at.gte.${now},due_at.is.null`);
    expect(builder.lt).not.toHaveBeenCalled();
    expect(builder.order).toHaveBeenCalledWith("due_at", {
      ascending: true, nullsFirst: false,
    });
  });

  it("retains ten overdue tasks without hiding a future task or an undated task", async () => {
    const overdue = query(Array.from({ length: 10 }, (_, i) =>
      row(`overdue-${i}`, `2026-10-${String(18 - i).padStart(2, "0")}T10:00:00.000Z`)));
    const upcoming = query([
      row("future", "2026-10-20T10:00:00.000Z"), row("undated", null),
    ]);
    const from = vi.fn().mockReturnValueOnce(overdue).mockReturnValueOnce(upcoming);
    const repository = new SupabaseStudyTaskRepository({ from } as never);
    const results = await repository.listPendingForBoard("owner-synthetic", now, 10);
    expect(results).toHaveLength(12);
    expect(results.map((task) => task.id)).toContain("future");
    expect(results.map((task) => task.id)).toContain("undated");
    expect(results.find((task) => task.id === "undated")?.dueAt).toBeNull();
    expect(from).toHaveBeenCalledTimes(2);
    for (const builder of [overdue, upcoming]) {
      expect(builder.eq.mock.calls).toEqual([
        ["owner_id", "owner-synthetic"], ["status", "pending"],
      ]);
      expect(builder.limit).toHaveBeenCalledWith(10);
    }
    expect(overdue.lt).toHaveBeenCalledWith("due_at", now);
    expect(overdue.order).toHaveBeenCalledWith("due_at", { ascending: false });
    expect(upcoming.or).toHaveBeenCalledWith(`due_at.gte.${now},due_at.is.null`);
    expect(upcoming.order).toHaveBeenCalledWith("due_at", {
      ascending: true, nullsFirst: false,
    });
  });

  it("breaks equal due-date ties by ID before applying each query limit", async () => {
    const sameOverdue = "2026-10-18T10:00:00.000Z";
    const sameFuture = "2026-10-20T10:00:00.000Z";
    const overdue = query([row("overdue-a", sameOverdue), row("overdue-b", sameOverdue)]);
    const upcoming = query([row("future-a", sameFuture), row("future-b", sameFuture)]);
    const from = vi.fn().mockReturnValueOnce(overdue).mockReturnValueOnce(upcoming);
    const repository = new SupabaseStudyTaskRepository({ from } as never);

    await repository.listPendingForBoard("owner-synthetic", now, 2);
    expect(overdue.order.mock.calls).toEqual([
      ["due_at", { ascending: false }],
      ["id", { ascending: true }],
    ]);
    expect(upcoming.order.mock.calls).toEqual([
      ["due_at", { ascending: true, nullsFirst: false }],
      ["id", { ascending: true }],
    ]);
    expect(overdue.limit).toHaveBeenCalledWith(2);
    expect(upcoming.limit).toHaveBeenCalledWith(2);

    const sanctuary = query([row("future-a", sameFuture), row("future-b", sameFuture)]);
    const upcomingRepository = new SupabaseStudyTaskRepository({
      from: vi.fn().mockReturnValue(sanctuary),
    } as never);
    await upcomingRepository.listUpcoming("owner-synthetic", now, 2);
    expect(sanctuary.order.mock.calls).toEqual([
      ["due_at", { ascending: true, nullsFirst: false }],
      ["id", { ascending: true }],
    ]);
    expect(sanctuary.limit).toHaveBeenCalledWith(2);
  });

  it.each([0, 1])("propagates pending-query errors from window %i", async (failedIndex) => {
    const good = query([]);
    const bad = query(null, { message: "synthetic database read failure" });
    const builders = failedIndex === 0 ? [bad, good] : [good, bad];
    const from = vi.fn().mockReturnValueOnce(builders[0]).mockReturnValueOnce(builders[1]);
    const repository = new SupabaseStudyTaskRepository({ from } as never);
    await expect(repository.listPendingForBoard("owner-synthetic", now))
      .rejects.toThrow("synthetic database read failure");
  });

  it("propagates upcoming-query errors without inventing an empty schedule", async () => {
    const builder = query(null, { message: "synthetic upcoming read failure" });
    const repository = new SupabaseStudyTaskRepository({
      from: vi.fn().mockReturnValue(builder),
    } as never);
    await expect(repository.listUpcoming("owner-synthetic", now))
      .rejects.toThrow("synthetic upcoming read failure");
  });
});
