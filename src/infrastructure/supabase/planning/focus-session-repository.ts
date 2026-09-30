import type { SupabaseClient } from "@supabase/supabase-js";

import type { FocusSession, FocusSessionRepository } from "@/domains/planning";

export class SupabaseFocusSessionRepository
  implements FocusSessionRepository
{
  constructor(private readonly supabase: SupabaseClient) {}

  async start(session: FocusSession): Promise<string> {
    const { data, error } = await this.supabase
      .from("focus_sessions")
      .insert({
        id: session.id,
        owner_id: session.ownerId,
        duration_seconds: session.durationSeconds,
        started_at: session.startedAt,
        completed_at: session.completedAt,
        created_at: session.createdAt,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return String(data.id);
  }

  async complete(
    ownerId: string,
    sessionId: string,
    completedAt: string,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("focus_sessions")
      .update({ completed_at: completedAt })
      .eq("id", sessionId)
      .eq("owner_id", ownerId)
      .is("completed_at", null);

    if (error) {
      throw new Error(error.message);
    }
  }
}
