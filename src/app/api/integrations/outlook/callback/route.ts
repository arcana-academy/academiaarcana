import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import {
  redeemOutlookAuthorizationCode,
} from "@/infrastructure/integrations/outlook-calendar-oauth";

export async function GET(request: Request) {
  await requireAuthenticatedUser();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(new URL("/cronograma?outlook=error", request.url));
  }

  try {
    await redeemOutlookAuthorizationCode(code, state);
    return NextResponse.redirect(
      new URL("/cronograma?outlook=connected", request.url),
    );
  } catch {
    return NextResponse.redirect(new URL("/cronograma?outlook=error", request.url));
  }
}
