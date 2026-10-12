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
    const { data, error } = await this.supabase
      .from("focus_sessions")
      .update({ completed_at: completedAt })
      .eq("id", sessionId)
      .eq("owner_id", ownerId)
      .is("completed_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (data) return;

    // A zero-row UPDATE is not evidence of completion. Confirm an already
    // completed session under the same ownership scope to allow safe retries
    // after a lost response without treating missing/foreign rows as success.
    const { data: existing, error: lookupError } = await this.supabase
      .from("focus_sessions")
      .select("completed_at")
      .eq("id", sessionId)
      .eq("owner_id", ownerId)
      .maybeSingle();

    if (lookupError) {
      throw new Error(lookupError.message);
    }
    if (existing?.completed_at != null) return;

    throw new Error("Não foi possível confirmar a conclusão da sessão.");
  }
}
