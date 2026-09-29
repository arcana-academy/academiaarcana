import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  TODOIST_ACCESS_TOKEN_COOKIE,
  verifyTodoistConnection,
} from "@/infrastructure/integrations/todoist";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAuthenticatedUser();

  const token = (await cookies()).get(TODOIST_ACCESS_TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.json(
      { providerId: "todoist", status: "disconnected" },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const verification = await verifyTodoistConnection(token);

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
