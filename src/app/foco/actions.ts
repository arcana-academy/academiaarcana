"use server";

import type { FocusSession } from "@/domains/focus";
import { SupabaseFocusSessionRepository } from "@/infrastructure/supabase/focus/focus-session-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

const MAX_DURATION_SECONDS = 4 * 60 * 60;

export async function startFocusSession(durationSeconds: number): Promise<FocusSession> {
  const claims = await requireAuthenticatedUser();
  if (!Number.isInteger(durationSeconds) || durationSeconds < 60 || durationSeconds > MAX_DURATION_SECONDS) {
    throw new Error("Duração de foco inválida.");
  }

  const supabase = await createClient();
  return new SupabaseFocusSessionRepository(supabase).start(
    claims.sub,
    durationSeconds,
    new Date().toISOString(),
  );
}

export async function completeFocusSession(id: string): Promise<FocusSession> {
  const claims = await requireAuthenticatedUser();
  if (!id) throw new Error("Sessão de foco inválida.");

  const supabase = await createClient();
  return new SupabaseFocusSessionRepository(supabase).complete(
    claims.sub,
    id,
    new Date().toISOString(),
  );
}
