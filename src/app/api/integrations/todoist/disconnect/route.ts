import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  revokeTodoistAccessToken,
  TODOIST_ACCESS_TOKEN_COOKIE,
} from "@/infrastructure/integrations/todoist";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await requireAuthenticatedUser();

  const cookieStore = await cookies();
  const token = cookieStore.get(TODOIST_ACCESS_TOKEN_COOKIE)?.value;

  cookieStore.delete(TODOIST_ACCESS_TOKEN_COOKIE);

  if (token) {
    try {
      await revokeTodoistAccessToken(token);
    } catch {
      // Local disconnect still succeeds even if the remote revocation endpoint is unavailable.
    }
  }

  return NextResponse.json({ connected: false }, { status: 200 });
}
