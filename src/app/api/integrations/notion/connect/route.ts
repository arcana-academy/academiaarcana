import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  buildNotionAuthorizationUrl,
  createNotionOAuthState,
  NOTION_OAUTH_STATE_COOKIE,
} from "@/infrastructure/integrations/notion";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireAuthenticatedUser();

  try {
    const state = createNotionOAuthState();
    const cookieStore = await cookies();

    cookieStore.set(NOTION_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      maxAge: 10 * 60,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return NextResponse.redirect(
      buildNotionAuthorizationUrl({
        state,
        requestUrl: request.url,
      }),
    );
  } catch {
    return NextResponse.redirect(
      new URL("/integracoes/notion?error=not_configured", request.url),
    );
  }
}
