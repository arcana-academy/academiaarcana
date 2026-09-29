import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  revokeTodoistAccessToken,
  TODOIST_CREDENTIALS_COOKIE,
  decryptTodoistCredentials,
} from "@/infrastructure/integrations/todoist";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

export async function POST() {
  await requireAuthenticatedUser();

  const cookieStore = await cookies();
  const credentials = await decryptTodoistCredentials(
    cookieStore.get(TODOIST_CREDENTIALS_COOKIE)?.value,
  );

  cookieStore.delete(TODOIST_CREDENTIALS_COOKIE);

  if (credentials?.accessToken) {
    try {
      await revokeTodoistAccessToken(credentials.accessToken);
    } catch {
      // Local disconnect still succeeds even if the remote revocation endpoint is unavailable.
    }
  }

  return NextResponse.json({ connected: false }, { status: 200 });
}
