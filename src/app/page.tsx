import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export default async function Page() {
  await requireAuthenticatedUser();
  redirect("/santuario");

  return null;
}
