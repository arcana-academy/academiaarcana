import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  buildAsanaAuthorizationUrl,
  createAsanaOAuthState,
  createAsanaOAuthVerifier,
  createAsanaPkceChallenge,
  ASANA_OAUTH_PKCE_COOKIE,
  ASANA_OAUTH_STATE_COOKIE,
} from "@/infrastructure/integrations/asana";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireAuthenticatedUser();
  try {
    const state = createAsanaOAuthState();
    const verifier = createAsanaOAuthVerifier();
    const challenge = await createAsanaPkceChallenge(verifier);
    const cookieStore = await cookies();

    cookieStore.set(ASANA_OAUTH_STATE_COOKIE, state, {
      httpOnly: true, maxAge: 600, path: "/", sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    cookieStore.set(ASANA_OAUTH_PKCE_COOKIE, verifier, {
      httpOnly: true, maxAge: 600, path: "/", sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return NextResponse.redirect(buildAsanaAuthorizationUrl({
      state, codeChallenge: challenge, requestUrl: request.url,
    }));
  } catch {
    return NextResponse.redirect(new URL("/integracoes/asana?error=not_configured", request.url));
  }
}
