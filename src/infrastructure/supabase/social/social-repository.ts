import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  FriendConnection,
  FriendConnectionStatus,
  SocialRepository,
} from "@/domains/social";

type FriendConnectionRow = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: FriendConnectionStatus;
  created_at: string;
  updated_at: string;
};

function toFriendConnection(row: FriendConnectionRow): FriendConnection {
  return {
    id: row.id,
    requesterId: row.requester_id,
    recipientId: row.recipient_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseSocialRepository implements SocialRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listConnections(participantId: string): Promise<FriendConnection[]> {
    const { data, error } = await this.supabase
      .from("friend_connections")
      .select(
        "id, requester_id, recipient_id, status, created_at, updated_at",
      )
      .or(
        `requester_id.eq.${participantId},recipient_id.eq.${participantId}`,
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) =>
      toFriendConnection(row as FriendConnectionRow),
    );
  }

  async updateConnectionStatus(
    recipientId: string,
    connectionId: string,
    status: Exclude<FriendConnectionStatus, "pending">,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("friend_connections")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connectionId)
      .eq("recipient_id", recipientId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async deleteConnection(
    participantId: string,
    connectionId: string,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("friend_connections")
      .delete()
      .eq("id", connectionId)
      .or(
        `requester_id.eq.${participantId},recipient_id.eq.${participantId}`,
      );

    if (error) {
      throw new Error(error.message);
    }
  }
}
