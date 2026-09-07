import { createClient } from "@/lib/supabase/server";

import { createResolveSubjectId } from "./resolve-subject-id";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type CreateSupabaseClient = () => Promise<SupabaseServerClient>;

export function createResolveSubjectIdServer(
  createSupabaseClient: CreateSupabaseClient = createClient,
): () => Promise<string | null> {
  return createResolveSubjectId(async () => {
    const supabase = await createSupabaseClient();

    const result = await supabase.auth.getClaims();

    return {
      data: {
        claims: result.data?.claims ?? null,
      },
      error: result.error,
    };
  });
}