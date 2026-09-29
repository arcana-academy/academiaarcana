import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  encryptNotionCredentials,
  exchangeNotionAuthorizationCode,
  NOTION_CREDENTIALS_COOKIE,
  NOTION_OAUTH_STATE_COOKIE,
  verifyNotionConnection,
} from "@/infrastructure/integrations/notion";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

function redirectError(request: Request, code: string) {
  return NextResponse.redirect(
    new URL(
      `/integracoes/notion?error=${encodeURIComponent(code)}`,
      request.url,
    ),
  );
}

export async function GET(request: Request) {
  const claims = await requireAuthenticatedUser();
  const searchParams = new URL(request.url).searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookieStore = await cookies();
  const storedState = cookieStore.get(NOTION_OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(NOTION_OAUTH_STATE_COOKIE);

  if (error) return redirectError(request, error);
  if (!code || !state || !storedState || state !== storedState) {
    return redirectError(request, "invalid_state");
  }

  try {
    const tokenSet = await exchangeNotionAuthorizationCode({
      code,
      requestUrl: request.url,
    });

    await verifyNotionConnection(tokenSet.accessToken, {
      id: tokenSet.workspaceId,
      name: tokenSet.workspaceName,
    });

    const credentials = {
      subjectId: claims.sub,
      ...tokenSet,
    };

    cookieStore.set(
      NOTION_CREDENTIALS_COOKIE,
      await encryptNotionCredentials(credentials),
      {
        httpOnly: true,
        maxAge: 365 * 24 * 60 * 60,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    );

    return NextResponse.redirect(
      new URL("/integracoes/notion?connected=1", request.url),
    );
  } catch {
    return redirectError(request, "authorization_failed");
  }
}
