import type { SupabaseClient } from "@supabase/supabase-js";

import type { FocusSession, FocusSessionRepository } from "@/domains/focus";

type FocusSessionRow = {
  id: string;
  owner_id: string;
  duration_seconds: number;
  started_at: string;
  completed_at: string | null;
};

function toDomain(row: FocusSessionRow): FocusSession {
  return {
    id: row.id,
    ownerId: row.owner_id,
    durationSeconds: row.duration_seconds,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

export class SupabaseFocusSessionRepository implements FocusSessionRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async start(ownerId: string, durationSeconds: number, startedAt: string) {
    const { data, error } = await this.supabase
      .from("focus_sessions")
      .insert({
        owner_id: ownerId,
        duration_seconds: durationSeconds,
        started_at: startedAt,
      })
      .select("id, owner_id, duration_seconds, started_at, completed_at")
      .single();

    if (error) throw new Error(error.message);
    return toDomain(data as FocusSessionRow);
  }

  async complete(ownerId: string, id: string, completedAt: string) {
    const { data, error } = await this.supabase
      .from("focus_sessions")
      .update({ completed_at: completedAt })
      .eq("id", id)
      .eq("owner_id", ownerId)
      .is("completed_at", null)
      .select("id, owner_id, duration_seconds, started_at, completed_at")
      .single();

    if (error) throw new Error(error.message);
    return toDomain(data as FocusSessionRow);
  }
}
