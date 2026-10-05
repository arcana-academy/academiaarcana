import { NextResponse } from "next/server";

import {
  clearOutlookAuthorizationTransaction,
  redeemOutlookAuthorizationCode,
} from "@/infrastructure/integrations/outlook-calendar-oauth";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export async function GET(request: Request) {
  const claims = await requireAuthenticatedUser();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error || !code || !state) {
    await clearOutlookAuthorizationTransaction();
    return NextResponse.redirect(
      new URL("/cronograma?outlook=error", request.url),
    );
  }

  try {
    await redeemOutlookAuthorizationCode(claims.sub, code, state);
    return NextResponse.redirect(
      new URL("/cronograma?outlook=connected", request.url),
    );
  } catch {
    return NextResponse.redirect(
      new URL("/cronograma?outlook=error", request.url),
    );
  }
}
