import { describe, expect, it, vi } from "vitest";

import type { FocusSession } from "@/domains/planning";

import { SupabaseFocusSessionRepository } from "./focus-session-repository";

function createSupabase(data: unknown = { id: "session-1" }, error: unknown = null) {
  const builder = {
    insert: vi.fn(() => builder),
    select: vi.fn(() => builder),
    single: vi.fn(async () => ({ data, error })),
    update: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    is: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => ({ data, error })),
  };

  return {
    from: vi.fn((table: string) => {
      if (table !== "focus_sessions") throw new Error("Unexpected table");
      return builder;
    }),
    builder,
  };
}

const session: FocusSession = {
  id: "session-1",
  ownerId: "user-1",
  durationSeconds: 1500,
  startedAt: "2026-09-30T16:00:00.000Z",
  completedAt: null,
  createdAt: "2026-09-30T16:00:00.000Z",
};

describe("SupabaseFocusSessionRepository", () => {
  it("persists a session with its owner scope", async () => {
    const supabase = createSupabase();

    const repository = new SupabaseFocusSessionRepository(supabase as never);

    await expect(repository.start(session)).resolves.toBe("session-1");

    const builder = (supabase.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value;
    expect(supabase.from).toHaveBeenCalledWith("focus_sessions");
    expect(builder.insert).toHaveBeenCalledWith({
      id: "session-1",
      owner_id: "user-1",
      duration_seconds: 1500,
      started_at: "2026-09-30T16:00:00.000Z",
      completed_at: null,
      created_at: "2026-09-30T16:00:00.000Z",
    });
  });

  it("completes only the specified user's open session", async () => {
    const supabase = createSupabase();

    const repository = new SupabaseFocusSessionRepository(supabase as never);

    await repository.complete(
      "user-1",
      "session-1",
      "2026-09-30T16:25:00.000Z",
    );

    const builder = (supabase.from as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value;
    expect(builder.update).toHaveBeenCalledWith({
      completed_at: "2026-09-30T16:25:00.000Z",
    });
    expect(builder.eq).toHaveBeenCalledWith("id", "session-1");
    expect(builder.eq).toHaveBeenCalledWith("owner_id", "user-1");
    expect(builder.is).toHaveBeenCalledWith("completed_at", null);
    expect(builder.select).toHaveBeenCalledWith("id");
    expect(builder.maybeSingle).toHaveBeenCalledTimes(1);
  });

  it("rejects a missing or foreign session when no row was updated", async () => {
    const supabase = createSupabase();
    const builder = supabase.builder;
    builder.maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    const repository = new SupabaseFocusSessionRepository(supabase as never);
    await expect(repository.complete("user-1", "missing-session", "2026-09-30T16:25:00.000Z"))
      .rejects.toThrow("Não foi possível confirmar a conclusão da sessão.");

    expect(builder.maybeSingle).toHaveBeenCalledTimes(2);
    expect(builder.select).toHaveBeenCalledWith("id");
    expect(builder.select).toHaveBeenCalledWith("completed_at");
    expect(builder.eq).toHaveBeenCalledWith("id", "missing-session");
    expect(builder.eq).toHaveBeenCalledWith("owner_id", "user-1");
    expect(supabase.from).toHaveBeenCalledTimes(2);
  });

  it("accepts a safe retry when the same owner's session was already completed", async () => {
    const supabase = createSupabase();
    const builder = supabase.builder;
    builder.maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: { completed_at: "2026-09-30T16:25:00.000Z" },
        error: null,
      });

    const repository = new SupabaseFocusSessionRepository(supabase as never);
    await expect(repository.complete("user-1", "session-1", "2026-09-30T16:26:00.000Z"))
      .resolves.toBeUndefined();
    expect(builder.select).toHaveBeenCalledWith("completed_at");
    expect(builder.eq).toHaveBeenCalledWith("owner_id", "user-1");
    expect(builder.maybeSingle).toHaveBeenCalledTimes(2);
  });

  it("rejects a zero-row completion when the owner-scoped row remains open", async () => {
    const supabase = createSupabase();
    const builder = supabase.builder;
    builder.maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { completed_at: null }, error: null });

    const repository = new SupabaseFocusSessionRepository(supabase as never);
    await expect(repository.complete("user-1", "session-1", "2026-09-30T16:25:00.000Z"))
      .rejects.toThrow("Não foi possível confirmar a conclusão da sessão.");
  });

  it("propagates an update error without attempting to verify another session", async () => {
    const supabase = createSupabase();
    const builder = supabase.builder;
    builder.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "update error" },
    });

    const repository = new SupabaseFocusSessionRepository(supabase as never);
    await expect(repository.complete("user-1", "session-1", "2026-09-30T16:25:00.000Z"))
      .rejects.toThrow("update error");
    expect(builder.maybeSingle).toHaveBeenCalledTimes(1);
  });

  it("rejects a failed owner-scoped verification instead of claiming success", async () => {
    const supabase = createSupabase();
    const builder = supabase.builder;
    builder.maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { message: "lookup failed" },
      });

    const repository = new SupabaseFocusSessionRepository(supabase as never);
    await expect(repository.complete("user-1", "session-1", "2026-09-30T16:25:00.000Z"))
      .rejects.toThrow("lookup failed");
  });
});
