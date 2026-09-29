import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  exchangeTodoistAuthorizationCode,
  TODOIST_CREDENTIALS_COOKIE,
  encryptTodoistCredentials,
  TODOIST_OAUTH_PKCE_COOKIE,
  TODOIST_OAUTH_STATE_COOKIE,
  verifyTodoistConnection,
} from "@/infrastructure/integrations/todoist";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

function redirectError(request: Request, code: string) {
  return NextResponse.redirect(
    new URL(`/integracoes/todoist?error=${encodeURIComponent(code)}`, request.url),
  );
}

export async function GET(request: Request) {
  const claims = await requireAuthenticatedUser();

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookieStore = await cookies();
  const storedState = cookieStore.get(TODOIST_OAUTH_STATE_COOKIE)?.value;
  const verifier = cookieStore.get(TODOIST_OAUTH_PKCE_COOKIE)?.value;

  cookieStore.delete(TODOIST_OAUTH_STATE_COOKIE);
  cookieStore.delete(TODOIST_OAUTH_PKCE_COOKIE);

  if (error) return redirectError(request, error);
  if (!code || !state || !storedState || state !== storedState || !verifier) {
    return redirectError(request, "invalid_state");
  }

  try {
    const tokenSet = await exchangeTodoistAuthorizationCode({
      code,
      codeVerifier: verifier,
      requestUrl: request.url,
    });

    await verifyTodoistConnection(tokenSet.accessToken);

    const credentials = {
      subjectId: claims.sub,
      ...tokenSet,
    };

    cookieStore.set(
      TODOIST_CREDENTIALS_COOKIE,
      await encryptTodoistCredentials(credentials),
      {
        httpOnly: true,
        maxAge: 365 * 24 * 60 * 60,
        path: "/",
        sameSite: "lax",
        secure: true,
      },
    );

    return NextResponse.redirect(
      new URL("/integracoes/todoist?connected=1", request.url),
    );
  } catch {
    return redirectError(request, "authorization_failed");
  }
}
