import { NextResponse } from "next/server";

import { TRELLO_CREDENTIALS_COOKIE } from "@/infrastructure/integrations/trello";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
  await requireAuthenticatedUser();
  const cookieStore = await cookies();
  cookieStore.delete(TRELLO_CREDENTIALS_COOKIE);
  return NextResponse.json({ connected: false }, { status: 200 });
}
