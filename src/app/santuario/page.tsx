import { getSanctuary } from "@/application/sanctuary/get-sanctuary";
import { Sanctuary } from "@/components/sanctuary/Sanctuary";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { SupabaseSanctuaryRepository } from "@/infrastructure/sanctuary/supabase-sanctuary-repository";
import { createClient } from "@/lib/supabase/server";

/** Render the authenticated Sanctuary route using the application layer. */
export default async function SanctuaryPage() {
  const claims = await requireAuthenticatedUser();

  const supabase = await createClient();
  const repository = new SupabaseSanctuaryRepository(supabase);

  const viewModel = await getSanctuary(repository, {
    user: {
      id: claims.sub,
    },
  });

  return <Sanctuary viewModel={viewModel} />;
}
