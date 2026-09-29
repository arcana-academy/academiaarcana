import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createOutlookAuthorizationUrl } from "@/infrastructure/integrations/outlook-calendar-oauth";

export async function GET(request: Request) {
  await requireAuthenticatedUser();
  const url = await createOutlookAuthorizationUrl();
  const next = new URL(request.url);
  next.pathname = "/cronograma";
  next.search = "";
  return NextResponse.redirect(url);
}
