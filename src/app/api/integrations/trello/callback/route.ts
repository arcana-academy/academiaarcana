import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  exchangeTrelloAuthorizationCode,
  encryptTrelloCredentials,
  TRELLO_CREDENTIALS_COOKIE,
  TRELLO_OAUTH_PKCE_COOKIE,
  TRELLO_OAUTH_STATE_COOKIE,
  verifyTrelloConnection,
} from "@/infrastructure/integrations/trello";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

function redirectError(request: Request, code: string) {
  return NextResponse.redirect(
    new URL(`/integracoes/trello?error=${encodeURIComponent(code)}`, request.url),
  );
}

export async function GET(request: Request) {
  const claims = await requireAuthenticatedUser();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookieStore = await cookies();
  const storedState = cookieStore.get(TRELLO_OAUTH_STATE_COOKIE)?.value;
  const verifier = cookieStore.get(TRELLO_OAUTH_PKCE_COOKIE)?.value;

  cookieStore.delete(TRELLO_OAUTH_STATE_COOKIE);
  cookieStore.delete(TRELLO_OAUTH_PKCE_COOKIE);

  if (error) return redirectError(request, error);
  if (!code || !state || !storedState || state !== storedState || !verifier) {
    return redirectError(request, "invalid_state");
  }

  try {
    const tokenSet = await exchangeTrelloAuthorizationCode({
      code,
      codeVerifier: verifier,
      requestUrl: request.url,
    });
    const verification = await verifyTrelloConnection(tokenSet.accessToken);

    cookieStore.set(
      TRELLO_CREDENTIALS_COOKIE,
      await encryptTrelloCredentials({ subjectId: claims.sub, ...tokenSet }),
      {
        httpOnly: true,
        maxAge: 365 * 24 * 60 * 60,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    );

    return NextResponse.redirect(
      new URL(
        `/integracoes/trello?connected=1&name=${encodeURIComponent(
          verification.user.fullName ?? verification.user.username ?? "Trello",
        )}`,
        request.url,
      ),
    );
  } catch {
    return redirectError(request, "authorization_failed");
  }
}
