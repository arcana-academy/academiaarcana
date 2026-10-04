import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  TODOIST_CREDENTIALS_COOKIE,
  decryptTodoistCredentials,
  encryptTodoistCredentials,
  refreshTodoistCredentials,
  shouldRefreshTodoistCredentials,
  verifyTodoistConnection,
} from "@/infrastructure/integrations/todoist";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const claims = await requireAuthenticatedUser();

  const cookieStore = await cookies();
  let credentials = await decryptTodoistCredentials(
    cookieStore.get(TODOIST_CREDENTIALS_COOKIE)?.value,
  );

  if (!credentials || credentials.subjectId !== claims.sub) {
    cookieStore.delete(TODOIST_CREDENTIALS_COOKIE);
    return NextResponse.json(
      { providerId: "todoist", status: "disconnected" },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    if (shouldRefreshTodoistCredentials(credentials)) {
      credentials = await refreshTodoistCredentials(credentials);
      cookieStore.set(
        TODOIST_CREDENTIALS_COOKIE,
        await encryptTodoistCredentials(credentials),
        {
          httpOnly: true,
          maxAge: 365 * 24 * 60 * 60,
          path: "/",
          sameSite: "lax",
          secure: true,
        },
      );
    }

    const verification = await verifyTodoistConnection(credentials.accessToken);

    return NextResponse.json(
      {
        providerId: verification.providerId,
        status: verification.status,
        user: verification.user,
        verifiedAt: verification.verifiedAt,
      },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        providerId: "todoist",
        status: "reauthorization_required",
      },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
