import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  encryptMicrosoftSharePointCredentials,
  exchangeMicrosoftSharePointAuthorizationCode,
  MICROSOFT_SHAREPOINT_CREDENTIALS_COOKIE,
  MICROSOFT_SHAREPOINT_OAUTH_PKCE_COOKIE,
  MICROSOFT_SHAREPOINT_OAUTH_STATE_COOKIE,
  verifyMicrosoftSharePointConnection,
} from "@/infrastructure/integrations/microsoft-sharepoint";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireAuthenticatedUser();
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(MICROSOFT_SHAREPOINT_OAUTH_STATE_COOKIE)?.value;
  const verifier = cookieStore.get(MICROSOFT_SHAREPOINT_OAUTH_PKCE_COOKIE)?.value;

  cookieStore.delete(MICROSOFT_SHAREPOINT_OAUTH_STATE_COOKIE);
  cookieStore.delete(MICROSOFT_SHAREPOINT_OAUTH_PKCE_COOKIE);

  if (error || !state || !expectedState || state !== expectedState || !code || !verifier) {
    return NextResponse.redirect(
      new URL("/integracoes?error=microsoft_sharepoint_authorization_failed", request.url),
    );
  }

  try {
    const credentials = await exchangeMicrosoftSharePointAuthorizationCode({
      code,
      codeVerifier: verifier,
      requestUrl: request.url,
      subjectId: user.id,
    });

    await verifyMicrosoftSharePointConnection(credentials.accessToken);

    cookieStore.set(
      MICROSOFT_SHAREPOINT_CREDENTIALS_COOKIE,
      await encryptMicrosoftSharePointCredentials(credentials),
      {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    );

    return NextResponse.redirect(
      new URL("/integracoes?microsoft_sharepoint=connected", request.url),
    );
  } catch {
    return NextResponse.redirect(
      new URL("/integracoes?error=microsoft_sharepoint_exchange_failed", request.url),
    );
  }
}
