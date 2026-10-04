import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  buildMicrosoftSharePointAuthorizationUrl,
  createMicrosoftOAuthState,
  createMicrosoftOAuthVerifier,
  createMicrosoftPkceChallenge,
  MICROSOFT_SHAREPOINT_OAUTH_PKCE_COOKIE,
  MICROSOFT_SHAREPOINT_OAUTH_STATE_COOKIE,
} from "@/infrastructure/integrations/microsoft-sharepoint";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireAuthenticatedUser();

  try {
    const state = createMicrosoftOAuthState();
    const verifier = createMicrosoftOAuthVerifier();
    const challenge = await createMicrosoftPkceChallenge(verifier);
    const cookieStore = await cookies();

    cookieStore.set(MICROSOFT_SHAREPOINT_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      maxAge: 10 * 60,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    cookieStore.set(MICROSOFT_SHAREPOINT_OAUTH_PKCE_COOKIE, verifier, {
      httpOnly: true,
      maxAge: 10 * 60,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return NextResponse.redirect(
      buildMicrosoftSharePointAuthorizationUrl({
        state,
        codeChallenge: challenge,
        requestUrl: request.url,
      }),
    );
  } catch {
    return NextResponse.redirect(
      new URL("/integracoes?error=microsoft_sharepoint_not_configured", request.url),
    );
  }
}
