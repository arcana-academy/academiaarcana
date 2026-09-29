"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

const MIN_DURATION_SECONDS = 60;
const MAX_DURATION_SECONDS = 4 * 60 * 60;

export async function startFocusSession(durationSeconds: number) {
  const claims = await requireAuthenticatedUser();
  if (
    !Number.isInteger(durationSeconds) ||
    durationSeconds < MIN_DURATION_SECONDS ||
    durationSeconds > MAX_DURATION_SECONDS
  ) {
    throw new Error("Duração da sessão de foco inválida.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("focus_sessions")
    .insert({
      owner_id: claims.sub,
      duration_seconds: durationSeconds,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function completeFocusSession(sessionId: string) {
  const claims = await requireAuthenticatedUser();
  if (!sessionId) throw new Error("Sessão de foco inválida.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("focus_sessions")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("owner_id", claims.sub)
    .is("completed_at", null);

  if (error) throw new Error(error.message);
}
