import { createHash, randomBytes } from "node:crypto";

import { cookies } from "next/headers";

import {
  OUTLOOK_CALENDAR_SCOPES,
  OutlookCalendarError,
} from "./outlook-calendar";
import {
  clearLegacyOutlookTokenCookies,
  storeOutlookTokens,
} from "./outlook-calendar-session";
import {
  createSubjectBoundOAuthState,
  verifySubjectBoundOAuthState,
} from "./oauth-transaction-state";

const STATE_COOKIE = "arcana_outlook_oauth_state";
const VERIFIER_COOKIE = "arcana_outlook_oauth_verifier";

function requireConfig() {
  const clientId = process.env.MICROSOFT_ENTRA_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_ENTRA_CLIENT_SECRET;
  const redirectUri = process.env.MICROSOFT_ENTRA_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new OutlookCalendarError(
      "MICROSOFT_ENTRA_CLIENT_ID, MICROSOFT_ENTRA_CLIENT_SECRET e MICROSOFT_ENTRA_REDIRECT_URI são obrigatórios.",
    );
  }
  return { clientId, clientSecret, redirectUri };
}

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 10 * 60,
  };
}

function createPkceVerifier() {
  return randomBytes(48).toString("base64url");
}

function createPkceChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

export async function createOutlookAuthorizationUrl(ownerId: string) {
  const { clientId, clientSecret, redirectUri } = requireConfig();
  const state = createSubjectBoundOAuthState(ownerId, clientSecret);
  const verifier = createPkceVerifier();
  const challenge = createPkceChallenge(verifier);
  const jar = await cookies();

  jar.set(STATE_COOKIE, state, baseCookieOptions());
  jar.set(VERIFIER_COOKIE, verifier, baseCookieOptions());

  const url = new URL(
    "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
  );
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", OUTLOOK_CALENDAR_SCOPES.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  return url.toString();
}

export async function clearOutlookAuthorizationTransaction() {
  const jar = await cookies();
  jar.delete(STATE_COOKIE);
  jar.delete(VERIFIER_COOKIE);
}

export async function redeemOutlookAuthorizationCode(
  ownerId: string,
  code: string,
  state: string,
) {
  const { clientId, clientSecret, redirectUri } = requireConfig();
  const jar = await cookies();
  const expectedState = jar.get(STATE_COOKIE)?.value;
  const verifier = jar.get(VERIFIER_COOKIE)?.value;

  jar.delete(STATE_COOKIE);
  jar.delete(VERIFIER_COOKIE);

  if (
    !expectedState ||
    !verifier ||
    expectedState !== state ||
    !verifySubjectBoundOAuthState(state, ownerId, clientSecret)
  ) {
    throw new OutlookCalendarError("Estado OAuth inválido ou expirado.");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
    scope: OUTLOOK_CALENDAR_SCOPES.join(" "),
  });

  const response = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new OutlookCalendarError(
      "Não foi possível concluir a autorização do Outlook.",
      response.status,
    );
  }

  const payload = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  if (!payload.refresh_token) {
    throw new OutlookCalendarError(
      "O Microsoft Entra não retornou um refresh token. Verifique offline_access.",
    );
  }

  await storeOutlookTokens(ownerId, {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: new Date(Date.now() + payload.expires_in * 1000).toISOString(),
  });

  await clearLegacyOutlookTokenCookies();
}
