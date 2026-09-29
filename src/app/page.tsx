import { redirect } from "next/navigation";

import { AcademiaArcanaLanding } from "@/components/generated/AcademiaArcanaLanding";
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

  return <AcademiaArcanaLanding />;
}
