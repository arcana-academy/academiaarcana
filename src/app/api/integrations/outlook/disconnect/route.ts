import { NextResponse } from "next/server";

import {
  clearLegacyOutlookTokenCookies,
  clearOutlookTokens,
} from "@/infrastructure/integrations/outlook-calendar-session";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export async function POST(request: Request) {
  const claims = await requireAuthenticatedUser();
  await clearOutlookTokens(claims.sub);
  await clearLegacyOutlookTokenCookies();
  return NextResponse.redirect(
    new URL("/cronograma?outlook=disconnected", request.url),
  );
}
