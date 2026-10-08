import { describe, expect, it, vi } from "vitest";

import { SupabaseSocialRepository } from "./social-repository";

function createSupabase(options?: {
  list?: {
    data: unknown[] | null;
    error: { message: string } | null;
  };
  mutationError?: { message: string } | null;
}) {
  const listResult = options?.list ?? { data: [], error: null };
  const mutationResult = { error: options?.mutationError ?? null };

  const order = vi.fn(async () => listResult);
  const listOr = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ or: listOr }));

  const updateRecipientEq = vi.fn(async () => mutationResult);
  const updateIdEq = vi.fn(() => ({ eq: updateRecipientEq }));
  const update = vi.fn(() => ({ eq: updateIdEq }));

  const deleteParticipantOr = vi.fn(async () => mutationResult);
  const deleteIdEq = vi.fn(() => ({ or: deleteParticipantOr }));
  const remove = vi.fn(() => ({ eq: deleteIdEq }));

  const from = vi.fn(() => ({
    select,
    update,
    delete: remove,
  }));

  return {
    client: { from },
    from,
    select,
    listOr,
    order,
    update,
    updateIdEq,
    updateRecipientEq,
    remove,
    deleteIdEq,
    deleteParticipantOr,
  };
}

describe("SupabaseSocialRepository", () => {
  it("lists participant connections using the social read boundary", async () => {
    const supabase = createSupabase({
      list: {
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
      },
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
    expect(supabase.listOr).toHaveBeenCalledWith(
      "requester_id.eq.user-1,recipient_id.eq.user-1",
    );
    expect(supabase.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
  });

  it("limits status transitions to the authenticated recipient", async () => {
    const supabase = createSupabase();
    const repository = new SupabaseSocialRepository(
      supabase.client as never,
    );

    await repository.updateConnectionStatus(
      "recipient-1",
      "connection-1",
      "accepted",
    );

    expect(supabase.update).toHaveBeenCalledWith({
      status: "accepted",
      updated_at: expect.any(String),
    });
    expect(supabase.updateIdEq).toHaveBeenCalledWith("id", "connection-1");
    expect(supabase.updateRecipientEq).toHaveBeenCalledWith(
      "recipient_id",
      "recipient-1",
    );
  });

  it("limits deletion to a participant in the connection", async () => {
    const supabase = createSupabase();
    const repository = new SupabaseSocialRepository(
      supabase.client as never,
    );

    await repository.deleteConnection("user-1", "connection-1");

    expect(supabase.remove).toHaveBeenCalledTimes(1);
    expect(supabase.deleteIdEq).toHaveBeenCalledWith("id", "connection-1");
    expect(supabase.deleteParticipantOr).toHaveBeenCalledWith(
      "requester_id.eq.user-1,recipient_id.eq.user-1",
    );
  });

  it("propagates persistence failures instead of masking them", async () => {
    const supabase = createSupabase({
      list: {
        data: null,
        error: { message: "social read failed" },
      },
    });

    const repository = new SupabaseSocialRepository(
      supabase.client as never,
    );

    await expect(repository.listConnections("user-1")).rejects.toThrow(
      "social read failed",
    );
  });

  it("propagates mutation failures instead of masking them", async () => {
    const supabase = createSupabase({
      mutationError: { message: "social mutation failed" },
    });

    const repository = new SupabaseSocialRepository(
      supabase.client as never,
    );

    await expect(
      repository.updateConnectionStatus(
        "recipient-1",
        "connection-1",
        "accepted",
      ),
    ).rejects.toThrow("social mutation failed");

    await expect(
      repository.deleteConnection("user-1", "connection-1"),
    ).rejects.toThrow("social mutation failed");
  });
});
