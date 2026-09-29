import { NextResponse } from "next/server";

import { clearOutlookTokens } from "@/infrastructure/integrations/outlook-calendar-session";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export async function POST(request: Request) {
  await requireAuthenticatedUser();
  await clearOutlookTokens();
  return NextResponse.redirect(new URL("/cronograma?outlook=disconnected", request.url));
}
