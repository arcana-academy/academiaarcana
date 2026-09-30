"use server";

import { FocusSessionService } from "@/application/planning/focus-sessions";
import { SupabaseFocusSessionRepository } from "@/infrastructure/supabase/planning/focus-session-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

export async function startFocusSession(durationSeconds: number) {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  const service = new FocusSessionService(
    new SupabaseFocusSessionRepository(supabase),
  );

  return service.start({
    ownerId: claims.sub,
    durationSeconds,
  });
}

export async function completeFocusSession(sessionId: string) {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  const service = new FocusSessionService(
    new SupabaseFocusSessionRepository(supabase),
  );

  await service.complete(claims.sub, sessionId);
}
