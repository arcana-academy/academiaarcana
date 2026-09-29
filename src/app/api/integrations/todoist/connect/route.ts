import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  buildTodoistAuthorizationUrl,
  createOAuthState,
  createOAuthVerifier,
  createPkceChallenge,
  TODOIST_OAUTH_PKCE_COOKIE,
  TODOIST_OAUTH_STATE_COOKIE,
} from "@/infrastructure/integrations/todoist";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireAuthenticatedUser();

  try {
    const state = createOAuthState();
    const verifier = createOAuthVerifier();
    const challenge = await createPkceChallenge(verifier);
    const cookieStore = await cookies();

    cookieStore.set(TODOIST_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      maxAge: 10 * 60,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    cookieStore.set(TODOIST_OAUTH_PKCE_COOKIE, verifier, {
      httpOnly: true,
      maxAge: 10 * 60,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return NextResponse.redirect(
      buildTodoistAuthorizationUrl({
        state,
        codeChallenge: challenge,
        requestUrl: request.url,
      }),
    );
  } catch {
    return NextResponse.redirect(
      new URL("/integracoes/todoist?error=not_configured", request.url),
    );
  }
}
