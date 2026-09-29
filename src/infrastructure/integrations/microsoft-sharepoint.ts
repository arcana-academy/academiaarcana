import type { IntegrationConnectionStatus, IntegrationDefinition, IntegrationToolResult } from "./contracts";

export const MICROSOFT_SHAREPOINT_PROVIDER_ID = "microsoft-sharepoint" as const;
export const MICROSOFT_SHAREPOINT_OAUTH_SCOPE =
  "openid profile email offline_access User.Read Files.Read Sites.Read.All" as const;
export const MICROSOFT_SHAREPOINT_PLUGIN_NAME = "Microsoft SharePoint" as const;
export const MICROSOFT_GRAPH_API_BASE_URL = "https://graph.microsoft.com/v1.0" as const;

export const MICROSOFT_SHAREPOINT_INTEGRATION_DEFINITION = {
  id: MICROSOFT_SHAREPOINT_PROVIDER_ID,
  displayName: MICROSOFT_SHAREPOINT_PLUGIN_NAME,
  authMode: "oauth2",
  capabilities: ["read", "search", "files", "versions", "metadata"],
  userConnectionRequired: true,
  serverSideOnly: true,
  scopes: MICROSOFT_SHAREPOINT_OAUTH_SCOPE.split(" "),
  documentationUrl: "https://learn.microsoft.com/graph/api/resources/drive",
} satisfies IntegrationDefinition;


export const MICROSOFT_SHAREPOINT_OAUTH_AUTHORIZE_URL =
  "https://login.microsoftonline.com/common/oauth2/v2.0/authorize" as const;
export const MICROSOFT_SHAREPOINT_OAUTH_TOKEN_URL =
  "https://login.microsoftonline.com/common/oauth2/v2.0/token" as const;
export const MICROSOFT_SHAREPOINT_CREDENTIALS_COOKIE =
  "__Host-aa-microsoft-sharepoint-credentials" as const;
export const MICROSOFT_SHAREPOINT_OAUTH_STATE_COOKIE =
  "__Host-aa-microsoft-sharepoint-state" as const;
export const MICROSOFT_SHAREPOINT_OAUTH_PKCE_COOKIE =
  "__Host-aa-microsoft-sharepoint-pkce" as const;

export type MicrosoftSharePointCredentials = {
  readonly subjectId: string;
  readonly accessToken: string;
  readonly refreshToken: string | null;
  readonly accessTokenExpiresAt: number | null;
};

export function getMicrosoftSharePointClientId(): string {
  const value = process.env.MICROSOFT_CLIENT_ID?.trim();
  if (!value) throw new MicrosoftSharePointConnectionError("MICROSOFT_CLIENT_ID não está configurado.");
  return value;
}

export function getMicrosoftSharePointClientSecret(): string {
  const value = process.env.MICROSOFT_CLIENT_SECRET?.trim();
  if (!value) throw new MicrosoftSharePointConnectionError("MICROSOFT_CLIENT_SECRET não está configurado.");
  return value;
}

export function getMicrosoftSharePointRedirectUri(requestUrl?: string): string {
  const configured = process.env.MICROSOFT_REDIRECT_URI?.trim();
  if (configured) return configured;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) return new URL("/api/integrations/microsoft-sharepoint/callback", appUrl).toString();
  if (process.env.NODE_ENV !== "production" && requestUrl) {
    return new URL("/api/integrations/microsoft-sharepoint/callback", requestUrl).toString();
  }
  throw new MicrosoftSharePointConnectionError(
    "Defina MICROSOFT_REDIRECT_URI (ou NEXT_PUBLIC_APP_URL) antes de conectar o Microsoft.",
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return globalThis.btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((value.length + 3) % 4);
  return Uint8Array.from(globalThis.atob(padded), (character) => character.charCodeAt(0));
}

export function createMicrosoftOAuthVerifier(): string {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

export function createMicrosoftOAuthState(): string {
  return createMicrosoftOAuthVerifier();
}

export async function createMicrosoftPkceChallenge(verifier: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return toBase64Url(new Uint8Array(digest));
}

export function buildMicrosoftSharePointAuthorizationUrl(input: {
  readonly state: string;
  readonly codeChallenge: string;
  readonly requestUrl?: string;
}): string {
  const params = new URLSearchParams({
    client_id: getMicrosoftSharePointClientId(),
    response_type: "code",
    redirect_uri: getMicrosoftSharePointRedirectUri(input.requestUrl),
    response_mode: "query",
    scope: MICROSOFT_SHAREPOINT_OAUTH_SCOPE,
    state: input.state,
    code_challenge: input.codeChallenge,
    code_challenge_method: "S256",
  });
  return `${MICROSOFT_SHAREPOINT_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeMicrosoftSharePointAuthorizationCode(input: {
  readonly code: string;
  readonly codeVerifier: string;
  readonly subjectId: string;
  readonly requestUrl?: string;
}): Promise<MicrosoftSharePointCredentials> {
  const response = await fetch(MICROSOFT_SHAREPOINT_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    cache: "no-store",
    body: new URLSearchParams({
      client_id: getMicrosoftSharePointClientId(),
      client_secret: getMicrosoftSharePointClientSecret(),
      code: input.code,
      redirect_uri: getMicrosoftSharePointRedirectUri(input.requestUrl),
      grant_type: "authorization_code",
      code_verifier: input.codeVerifier,
      scope: MICROSOFT_SHAREPOINT_OAUTH_SCOPE,
    }),
  });

  if (!response.ok) {
    throw new MicrosoftSharePointConnectionError("Não foi possível concluir a autorização Microsoft.");
  }

  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (!payload.access_token) {
    throw new MicrosoftSharePointConnectionError("A Microsoft não devolveu um token de acesso válido.");
  }

  return {
    subjectId: input.subjectId,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    accessTokenExpiresAt:
      typeof payload.expires_in === "number" ? Date.now() + payload.expires_in * 1000 : null,
  };
}

async function getMicrosoftSharePointCookieKey(): Promise<CryptoKey> {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(getMicrosoftSharePointClientSecret()),
  );
  return globalThis.crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptMicrosoftSharePointCredentials(
  credentials: MicrosoftSharePointCredentials,
): Promise<string> {
  const iv = new Uint8Array(12);
  globalThis.crypto.getRandomValues(iv);
  const plaintext = new TextEncoder().encode(JSON.stringify(credentials));
  const ciphertext = new Uint8Array(
    await globalThis.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      await getMicrosoftSharePointCookieKey(),
      plaintext,
    ),
  );
  const payload = new Uint8Array(iv.length + ciphertext.length);
  payload.set(iv);
  payload.set(ciphertext, iv.length);
  return toBase64Url(payload);
}

export async function decryptMicrosoftSharePointCredentials(
  value?: string | null,
): Promise<MicrosoftSharePointCredentials | null> {
  if (!value) return null;
  try {
    const payload = fromBase64Url(value);
    const iv = payload.slice(0, 12);
    const ciphertext = payload.slice(12);
    if (iv.length !== 12 || ciphertext.length === 0) return null;
    const plaintext = await globalThis.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      await getMicrosoftSharePointCookieKey(),
      ciphertext,
    );
    const parsed = JSON.parse(new TextDecoder().decode(plaintext)) as Partial<MicrosoftSharePointCredentials>;
    if (
      typeof parsed.subjectId !== "string" ||
      !parsed.subjectId ||
      typeof parsed.accessToken !== "string" ||
      !parsed.accessToken ||
      (parsed.refreshToken !== null && typeof parsed.refreshToken !== "string") ||
      (parsed.accessTokenExpiresAt !== null && typeof parsed.accessTokenExpiresAt !== "number")
    ) return null;
    return {
      subjectId: parsed.subjectId,
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken ?? null,
      accessTokenExpiresAt: parsed.accessTokenExpiresAt ?? null,
    };
  } catch {
    return null;
  }
}

export type MicrosoftSharePointOperation =
  | "list-root"
  | "list-folder"
  | "search"
  | "get-metadata"
  | "list-versions";

export type MicrosoftSharePointConnectionVerification = {
  readonly providerId: typeof MICROSOFT_SHAREPOINT_PROVIDER_ID;
  readonly pluginName: typeof MICROSOFT_SHAREPOINT_PLUGIN_NAME;
  readonly status: Extract<IntegrationConnectionStatus, "connected" | "error">;
  readonly driveId: string;
  readonly verifiedAt: string;
};

export class MicrosoftSharePointConnectionError extends Error {
  constructor(message = "Microsoft SharePoint não está configurado ou autorizado.") {
    super(message);
    this.name = "MicrosoftSharePointConnectionError";
  }
}

function getAccessToken(token = process.env.MICROSOFT_GRAPH_ACCESS_TOKEN): string {
  if (!token?.trim()) throw new MicrosoftSharePointConnectionError();
  return token.trim();
}

async function graphRequest<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${MICROSOFT_GRAPH_API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new MicrosoftSharePointConnectionError(
      `Microsoft Graph respondeu com HTTP ${response.status}.`,
    );
  }

  return (await response.json()) as T;
}

export async function verifyMicrosoftSharePointConnection(
  token = process.env.MICROSOFT_GRAPH_ACCESS_TOKEN,
): Promise<MicrosoftSharePointConnectionVerification> {
  const drive = await graphRequest<{ id: string }>("/me/drive", getAccessToken(token));

  return {
    providerId: MICROSOFT_SHAREPOINT_PROVIDER_ID,
    pluginName: MICROSOFT_SHAREPOINT_PLUGIN_NAME,
    status: "connected",
    driveId: drive.id,
    verifiedAt: new Date().toISOString(),
  };
}

export async function listMicrosoftSharePointRoot(
  token = process.env.MICROSOFT_GRAPH_ACCESS_TOKEN,
): Promise<IntegrationToolResult> {
  return executeMicrosoftSharePointOperation("list-root", {}, token);
}

export async function listMicrosoftSharePointFolder(
  folderId: string,
  token = process.env.MICROSOFT_GRAPH_ACCESS_TOKEN,
): Promise<IntegrationToolResult> {
  const normalizedId = folderId.trim();
  if (!normalizedId) throw new Error("O ID da pasta do SharePoint não pode estar vazio.");
  return executeMicrosoftSharePointOperation("list-folder", { folderId: normalizedId }, token);
}

export async function searchMicrosoftSharePoint(
  query: string,
  token = process.env.MICROSOFT_GRAPH_ACCESS_TOKEN,
): Promise<IntegrationToolResult> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) throw new Error("A busca do SharePoint não pode estar vazia.");
  return executeMicrosoftSharePointOperation("search", { query: normalizedQuery }, token);
}

export async function getMicrosoftSharePointMetadata(
  itemId: string,
  token = process.env.MICROSOFT_GRAPH_ACCESS_TOKEN,
): Promise<IntegrationToolResult> {
  const normalizedId = itemId.trim();
  if (!normalizedId) throw new Error("O ID do item do SharePoint não pode estar vazio.");
  return executeMicrosoftSharePointOperation("get-metadata", { itemId: normalizedId }, token);
}

export async function listMicrosoftSharePointVersions(
  itemId: string,
  token = process.env.MICROSOFT_GRAPH_ACCESS_TOKEN,
): Promise<IntegrationToolResult> {
  const normalizedId = itemId.trim();
  if (!normalizedId) throw new Error("O ID do item do SharePoint não pode estar vazio.");
  return executeMicrosoftSharePointOperation("list-versions", { itemId: normalizedId }, token);
}

export async function executeMicrosoftSharePointOperation(
  operation: MicrosoftSharePointOperation,
  input: Record<string, unknown>,
  token = process.env.MICROSOFT_GRAPH_ACCESS_TOKEN,
): Promise<IntegrationToolResult> {
  const accessToken = getAccessToken(token);
  let path: string;

  switch (operation) {
    case "list-root":
      path = "/me/drive/root/children";
      break;
    case "list-folder":
      path = `/me/drive/items/${encodeURIComponent(String(input.folderId))}/children`;
      break;
    case "search":
      path = `/me/drive/root/search(q='${encodeURIComponent(String(input.query))}')`;
      break;
    case "get-metadata":
      path = `/me/drive/items/${encodeURIComponent(String(input.itemId))}`;
      break;
    case "list-versions":
      path = `/me/drive/items/${encodeURIComponent(String(input.itemId))}/versions`;
      break;
    default:
      throw new Error(`Operação Microsoft SharePoint não suportada: ${String(operation)}`);
  }

  const output = await graphRequest<unknown>(path, accessToken);
  return { providerId: MICROSOFT_SHAREPOINT_PROVIDER_ID, tool: operation, output };
}
