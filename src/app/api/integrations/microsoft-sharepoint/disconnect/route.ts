import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { MICROSOFT_SHAREPOINT_CREDENTIALS_COOKIE } from "@/infrastructure/integrations/microsoft-sharepoint";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

export async function POST() {
  await requireAuthenticatedUser();
  const cookieStore = await cookies();
  cookieStore.delete(MICROSOFT_SHAREPOINT_CREDENTIALS_COOKIE);
  return NextResponse.json({ status: "disconnected" });
}
