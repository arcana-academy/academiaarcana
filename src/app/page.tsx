import { redirect } from "next/navigation";

import ArcanaLanding from "@/components/marketing/ArcanaLanding";
import { createClient } from "@/lib/supabase/server";

async function hasAuthenticatedSession(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    return Boolean(data?.claims?.sub);
  } catch {
    return false;
  }
}

export default async function Page() {
  if (await hasAuthenticatedSession()) redirect("/santuario");

  return <ArcanaLanding />;
}
