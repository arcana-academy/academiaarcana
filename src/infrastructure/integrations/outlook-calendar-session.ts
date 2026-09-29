import { cookies } from "next/headers";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { OutlookCalendarError } from "./outlook-calendar";

const ACCESS_COOKIE = "arcana_outlook_access";
const REFRESH_COOKIE = "arcana_outlook_refresh";
const EXPIRY_COOKIE = "arcana_outlook_expiry";

function getEncryptionKey(): Buffer {
  const secret = process.env.OUTLOOK_CALENDAR_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new OutlookCalendarError(
      "OUTLOOK_CALENDAR_SESSION_SECRET precisa ter pelo menos 32 caracteres.",
    );
  }
  return createHash("sha256").update(secret).digest();
}

function encrypt(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function decrypt(value: string): string {
  const [ivText, tagText, payloadText] = value.split(".");
  if (!ivText || !tagText || !payloadText) {
    throw new OutlookCalendarError("Credencial Outlook inválida.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivText, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(payloadText, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function storeOutlookTokens(input: {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}) {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, encrypt(input.accessToken), cookieOptions(60 * 60));
  jar.set(REFRESH_COOKIE, encrypt(input.refreshToken), cookieOptions(60 * 60 * 24 * 30));
  jar.set(EXPIRY_COOKIE, input.expiresAt, cookieOptions(60 * 60 * 24 * 30));
}

export async function clearOutlookTokens() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
  jar.delete(EXPIRY_COOKIE);
}

async function refreshAccessToken(refreshToken: string) {
  const clientId = process.env.MICROSOFT_ENTRA_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_ENTRA_CLIENT_SECRET;
  const redirectUri = process.env.MICROSOFT_ENTRA_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new OutlookCalendarError(
      "A configuração do Microsoft Entra para o Outlook está incompleta.",
    );
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    redirect_uri: redirectUri,
    scope: "openid profile email offline_access User.Read Calendars.ReadWrite",
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
    await clearOutlookTokens();
    throw new OutlookCalendarError(
      "A autorização do Outlook expirou. Conecte novamente sua conta.",
      response.status,
    );
  }

  const payload = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  const expiresAt = new Date(Date.now() + payload.expires_in * 1000).toISOString();
  await storeOutlookTokens({
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? refreshToken,
    expiresAt,
  });

  return payload.access_token;
}

export async function getOutlookAccessToken(): Promise<string | null> {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  const expiresAt = jar.get(EXPIRY_COOKIE)?.value;

  if (!access || !refresh || !expiresAt) return null;

  const expiry = new Date(expiresAt).getTime();
  if (Number.isFinite(expiry) && expiry > Date.now() + 60_000) {
    return decrypt(access);
  }

  return refreshAccessToken(decrypt(refresh));
}

export async function isOutlookCalendarConnected(): Promise<boolean> {
  const jar = await cookies();
  return Boolean(
    jar.get(ACCESS_COOKIE)?.value &&
      jar.get(REFRESH_COOKIE)?.value &&
      jar.get(EXPIRY_COOKIE)?.value,
  );
}
