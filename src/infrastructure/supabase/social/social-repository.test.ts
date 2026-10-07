import { describe, expect, it, vi } from "vitest";

import { SupabaseSocialRepository } from "./social-repository";

function createSupabase(result: {
  data: unknown[] | null;
  error: { message: string } | null;
}) {
  const order = vi.fn(async () => result);
  const or = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ or }));
  const from = vi.fn(() => ({ select }));

  return { client: { from }, from, select, or, order };
}

describe("SupabaseSocialRepository", () => {
  it("lists participant connections using the social read boundary", async () => {
    const supabase = createSupabase({
      data: [
        {
          id: "connection-1",
          requester_id: "user-1",
          recipient_id: "user-2",
          status: "accepted",
          created_at: "2026-10-07T12:00:00.000Z",
          updated_at: "2026-10-07T12:05:00.000Z",
        },
      ],
      error: null,
    });

    const repository = new SupabaseSocialRepository(
      supabase.client as never,
    );

    await expect(repository.listConnections("user-1")).resolves.toEqual([
      {
        id: "connection-1",
        requesterId: "user-1",
        recipientId: "user-2",
        status: "accepted",
        createdAt: "2026-10-07T12:00:00.000Z",
        updatedAt: "2026-10-07T12:05:00.000Z",
      },
    ]);

    expect(supabase.from).toHaveBeenCalledWith("friend_connections");
    expect(supabase.or).toHaveBeenCalledWith(
      "requester_id.eq.user-1,recipient_id.eq.user-1",
    );
    expect(supabase.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
  });

  it("propagates persistence failures instead of masking them", async () => {
    const supabase = createSupabase({
      data: null,
      error: { message: "social read failed" },
    });

    const repository = new SupabaseSocialRepository(
      supabase.client as never,
    );

    await expect(repository.listConnections("user-1")).rejects.toThrow(
      "social read failed",
    );
  });
});
