import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { cookies } from "next/headers";

import { OutlookCalendarError, OUTLOOK_CALENDAR_PROVIDER_ID } from "./outlook-calendar";
import { createClient } from "@/lib/supabase/server";

const STATE_COOKIE_NAMES = {
  access: "arcana_outlook_access",
  refresh: "arcana_outlook_refresh",
  expiry: "arcana_outlook_expiry",
  oauthState: "arcana_outlook_oauth_state",
  verifier: "arcana_outlook_oauth_verifier",
} as const;

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

async function getAuthenticatedSubjectId(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) return null;
  return data.claims.sub;
}

async function getStoredCredential(ownerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integration_credentials")
    .select(
      "access_token_ciphertext, refresh_token_ciphertext, access_expires_at",
    )
    .eq("owner_id", ownerId)
    .eq("provider_id", OUTLOOK_CALENDAR_PROVIDER_ID)
    .maybeSingle();

  if (error) {
    throw new OutlookCalendarError(
      "Não foi possível acessar a conexão do Outlook.",
    );
  }

  return data as {
    access_token_ciphertext: string;
    refresh_token_ciphertext: string;
    access_expires_at: string;
  } | null;
}

export async function storeOutlookTokens(
  ownerId: string,
  input: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase.from("integration_credentials").upsert(
    {
      owner_id: ownerId,
      provider_id: OUTLOOK_CALENDAR_PROVIDER_ID,
      access_token_ciphertext: encrypt(input.accessToken),
      refresh_token_ciphertext: encrypt(input.refreshToken),
      access_expires_at: input.expiresAt,
    },
    { onConflict: "owner_id,provider_id" },
  );

  if (error) {
    throw new OutlookCalendarError(
      "Não foi possível salvar a conexão do Outlook.",
    );
  }
}

export async function clearOutlookTokens(ownerId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("integration_credentials")
    .delete()
    .eq("owner_id", ownerId)
    .eq("provider_id", OUTLOOK_CALENDAR_PROVIDER_ID);

  if (error) {
    throw new OutlookCalendarError(
      "Não foi possível remover a conexão do Outlook.",
    );
  }
}

async function refreshAccessToken(ownerId: string, refreshToken: string) {
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
    scope: "offline_access Calendars.ReadWrite",
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
    await clearOutlookTokens(ownerId);
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

  await storeOutlookTokens(ownerId, {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? refreshToken,
    expiresAt: new Date(Date.now() + payload.expires_in * 1000).toISOString(),
  });

  return payload.access_token;
}

export async function getOutlookAccessToken(
  options: { refresh?: boolean } = {},
): Promise<string | null> {
  const ownerId = await getAuthenticatedSubjectId();
  if (!ownerId) return null;

  const credential = await getStoredCredential(ownerId);
  if (!credential) return null;

  try {
    const expiry = new Date(credential.access_expires_at).getTime();
    if (Number.isFinite(expiry) && expiry > Date.now() + 60_000) {
      return decrypt(credential.access_token_ciphertext);
    }

    if (!options.refresh) return null;
    return refreshAccessToken(
      ownerId,
      decrypt(credential.refresh_token_ciphertext),
    );
  } catch (error) {
    if (error instanceof OutlookCalendarError) throw error;
    throw new OutlookCalendarError("Não foi possível ler a conexão do Outlook.");
  }
}

export async function isOutlookCalendarConnected(): Promise<boolean> {
  const ownerId = await getAuthenticatedSubjectId();
  if (!ownerId) return false;

  const credential = await getStoredCredential(ownerId);
  if (!credential) return false;

  try {
    decrypt(credential.access_token_ciphertext);
    decrypt(credential.refresh_token_ciphertext);
    return true;
  } catch {
    return false;
  }
}

export async function clearLegacyOutlookTokenCookies() {
  const jar = await cookies();
  jar.delete(STATE_COOKIE_NAMES.access);
  jar.delete(STATE_COOKIE_NAMES.refresh);
  jar.delete(STATE_COOKIE_NAMES.expiry);
}
