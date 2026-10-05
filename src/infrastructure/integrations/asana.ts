import type {
  IntegrationDefinition,
  IntegrationToolResult,
} from "./contracts";

export const ASANA_PROVIDER_ID = "asana" as const;
export const ASANA_PLUGIN_NAME = "Asana" as const;
export const ASANA_API_BASE_URL = "https://app.asana.com/api/1.0" as const;
export const ASANA_OAUTH_AUTHORIZE_URL = "https://app.asana.com/-/oauth_authorize" as const;
export const ASANA_OAUTH_TOKEN_URL = "https://app.asana.com/-/oauth_token" as const;
export const ASANA_OAUTH_REVOKE_URL = "https://app.asana.com/-/oauth_revoke" as const;

export const ASANA_CREDENTIALS_COOKIE = "__Host-aa-asana-credentials" as const;
export const ASANA_OAUTH_STATE_COOKIE = "__Host-aa-asana-state" as const;
export const ASANA_OAUTH_PKCE_COOKIE = "__Host-aa-asana-pkce" as const;

export const ASANA_OAUTH_SCOPES = [
  "openid",
  "profile",
  "email",
  "tasks:read",
  "tasks:write",
  "projects:read",
  "projects:write",
] as const;

export const ASANA_INTEGRATION_DEFINITION = {
  id: ASANA_PROVIDER_ID,
  displayName: ASANA_PLUGIN_NAME,
  authMode: "oauth2",
  capabilities: ["read", "write", "search"],
  userConnectionRequired: true,
  serverSideOnly: true,
  scopes: ASANA_OAUTH_SCOPES,
  documentationUrl: "https://developers.asana.com/docs/oauth",
} satisfies IntegrationDefinition;

export type AsanaTokenSet = {
  readonly accessToken: string;
  readonly refreshToken: string | null;
  readonly accessTokenExpiresAt: number | null;
};

export type AsanaCredentials = AsanaTokenSet & {
  readonly subjectId: string;
};

export type AsanaUser = {
  readonly id: string;
  readonly name?: string;
  readonly email?: string;
};

export type AsanaProject = {
  readonly id: string;
  readonly name: string;
};

export type AsanaTask = {
  readonly id: string;
  readonly name: string;
  readonly notes?: string;
  readonly completed?: boolean;
  readonly dueOn?: string | null;
  readonly dueAt?: string | null;
  readonly projectIds?: readonly string[];
};

export class AsanaConnectionError extends Error {
  constructor(
    message = "Asana não está configurado ou autorizado.",
    public readonly code = "connection_error",
  ) {
    super(message);
    this.name = "AsanaConnectionError";
  }
}

export function getAsanaClientId(): string {
  const value = process.env.ASANA_CLIENT_ID?.trim();
  if (!value) throw new AsanaConnectionError("ASANA_CLIENT_ID não está configurado.", "not_configured");
  return value;
}

export function getAsanaClientSecret(): string {
  const value = process.env.ASANA_CLIENT_SECRET?.trim();
  if (!value) throw new AsanaConnectionError("ASANA_CLIENT_SECRET não está configurado.", "not_configured");
  return value;
}

export function getAsanaRedirectUri(requestUrl?: string): string {
  const configured = process.env.ASANA_REDIRECT_URI?.trim();
  if (configured) return configured;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) return new URL("/api/integrations/asana/callback", appUrl).toString();

  if (process.env.NODE_ENV !== "production" && requestUrl) {
    return new URL("/api/integrations/asana/callback", requestUrl).toString();
  }

  throw new AsanaConnectionError(
    "Defina ASANA_REDIRECT_URI (ou NEXT_PUBLIC_APP_URL) antes de conectar o Asana.",
    "not_configured",
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return globalThis.btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((value.length + 3) % 4);
  const binary = globalThis.atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function getCookieKey(): Promise<CryptoKey> {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(getAsanaClientSecret()),
  );
  return globalThis.crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptAsanaCredentials(credentials: AsanaCredentials): Promise<string> {
  const iv = new Uint8Array(12);
  globalThis.crypto.getRandomValues(iv);
  const plaintext = new TextEncoder().encode(JSON.stringify(credentials));
  const ciphertext = new Uint8Array(
    await globalThis.crypto.subtle.encrypt({ name: "AES-GCM", iv }, await getCookieKey(), plaintext),
  );
  const payload = new Uint8Array(iv.length + ciphertext.length);
  payload.set(iv);
  payload.set(ciphertext, iv.length);
  return toBase64Url(payload);
}

export async function decryptAsanaCredentials(value?: string | null): Promise<AsanaCredentials | null> {
  if (!value) return null;

  try {
    const payload = fromBase64Url(value);
    const iv = payload.slice(0, 12);
    const ciphertext = payload.slice(12);
    if (iv.length !== 12 || ciphertext.length === 0) return null;

    const plaintext = await globalThis.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      await getCookieKey(),
      ciphertext,
    );
    const parsed = JSON.parse(new TextDecoder().decode(plaintext)) as Partial<AsanaCredentials>;

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

export function createAsanaOAuthVerifier(): string {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

export async function createAsanaPkceChallenge(verifier: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return toBase64Url(new Uint8Array(digest));
}

export function buildAsanaAuthorizationUrl(input: {
  readonly state: string;
  readonly codeChallenge: string;
  readonly requestUrl?: string;
}): string {
  const params = new URLSearchParams({
    client_id: getAsanaClientId(),
    redirect_uri: getAsanaRedirectUri(input.requestUrl),
    response_type: "code",
    state: input.state,
    code_challenge_method: "S256",
    code_challenge: input.codeChallenge,
    scope: ASANA_OAUTH_SCOPES.join(" "),
  });
  return `${ASANA_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

function normalizeTokenSet(payload: {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}): AsanaTokenSet {
  if (!payload.access_token?.trim()) {
    throw new AsanaConnectionError("A Asana não devolveu um token de acesso válido.", "authorization_failed");
  }
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    accessTokenExpiresAt:
      typeof payload.expires_in === "number" ? Date.now() + payload.expires_in * 1000 : null,
  };
}

export async function exchangeAsanaAuthorizationCode(input: {
  readonly code: string;
  readonly codeVerifier: string;
  readonly requestUrl?: string;
}): Promise<AsanaTokenSet> {
  const response = await fetch(ASANA_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    cache: "no-store",
    body: new URLSearchParams({
      client_id: getAsanaClientId(),
      client_secret: getAsanaClientSecret(),
      redirect_uri: getAsanaRedirectUri(input.requestUrl),
      grant_type: "authorization_code",
      code: input.code,
      code_verifier: input.codeVerifier,
    }),
  });

  if (!response.ok) {
    throw new AsanaConnectionError("Não foi possível concluir a autorização do Asana.", "authorization_failed");
  }

  return normalizeTokenSet(await response.json());
}

export function shouldRefreshAsanaCredentials(credentials: AsanaCredentials, now = Date.now()): boolean {
  return Boolean(
    credentials.refreshToken &&
      credentials.accessTokenExpiresAt !== null &&
      credentials.accessTokenExpiresAt - now <= 60_000,
  );
}

export async function refreshAsanaCredentials(credentials: AsanaCredentials): Promise<AsanaCredentials> {
  if (!credentials.refreshToken) {
    throw new AsanaConnectionError("A autorização do Asana não possui refresh token. Reconecte a conta.", "reauthorization_required");
  }

  const response = await fetch(ASANA_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    cache: "no-store",
    body: new URLSearchParams({
      client_id: getAsanaClientId(),
      client_secret: getAsanaClientSecret(),
      grant_type: "refresh_token",
      refresh_token: credentials.refreshToken,
    }),
  });

  if (!response.ok) {
    throw new AsanaConnectionError("A autorização do Asana expirou ou foi revogada. Reconecte a conta.", "reauthorization_required");
  }

  return { subjectId: credentials.subjectId, ...normalizeTokenSet(await response.json()) };
}

async function asanaRequest<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const normalizedToken = token.trim();
  if (!normalizedToken) throw new AsanaConnectionError();

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${normalizedToken}`);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${ASANA_API_BASE_URL}${path}`, { ...init, headers, cache: "no-store" });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new AsanaConnectionError(
        response.status === 403
          ? "A conta Asana não possui autorização suficiente para esta operação."
          : "A autorização do Asana expirou ou foi revogada. Reconecte a conta.",
        response.status === 403 ? "insufficient_scope" : "reauthorization_required",
      );
    }
    if (response.status === 429) throw new AsanaConnectionError("A Asana atingiu o limite de requisições. Tente novamente mais tarde.", "rate_limited");
    throw new AsanaConnectionError(`Asana API respondeu com HTTP ${response.status}.`, "provider_error");
  }

  if (response.status === 204) return undefined as T;
  const payload = (await response.json()) as { data?: T };
  if (!payload || !("data" in payload)) throw new AsanaConnectionError("A Asana devolveu uma resposta inválida.", "malformed_response");
  return payload.data as T;
}

export async function verifyAsanaConnection(token: string): Promise<{ providerId: typeof ASANA_PROVIDER_ID; status: "connected"; user: AsanaUser; verifiedAt: string }> {
  const user = await asanaRequest<AsanaUser>("/users/me?opt_fields=gid,name,email", token);
  return {
    providerId: ASANA_PROVIDER_ID,
    status: "connected",
    user: { id: user.id, name: user.name, email: user.email },
    verifiedAt: new Date().toISOString(),
  };
}

export async function getAsanaProjects(token: string): Promise<IntegrationToolResult> {
  const projects = await asanaRequest<AsanaProject[]>("/projects?limit=100&opt_fields=gid,name", token);
  return { providerId: ASANA_PROVIDER_ID, tool: "list_projects", output: projects };
}

export async function getAsanaTasks(token: string, projectId?: string): Promise<IntegrationToolResult> {
  const path = projectId?.trim()
    ? `/projects/${encodeURIComponent(projectId.trim())}/tasks?limit=100&opt_fields=gid,name,notes,completed,due_on,due_at,memberships.project.gid`
    : "/tasks?limit=100&assignee=me&workspace=me&opt_fields=gid,name,notes,completed,due_on,due_at,memberships.project.gid";
  const tasks = await asanaRequest<AsanaTask[]>(path, token);
  return { providerId: ASANA_PROVIDER_ID, tool: "list_tasks", output: tasks };
}

export async function createAsanaTask(
  token: string,
  input: { readonly name: string; readonly notes?: string; readonly dueOn?: string; readonly dueAt?: string; readonly projectId?: string },
): Promise<IntegrationToolResult> {
  const name = input.name.trim();
  if (!name) throw new Error("O nome da tarefa do Asana não pode estar vazio.");

  const data: Record<string, unknown> = { name };
  if (input.notes?.trim()) data.notes = input.notes.trim();
  if (input.dueOn) data.due_on = input.dueOn;
  if (input.dueAt) data.due_at = input.dueAt;
  if (input.projectId?.trim()) data.projects = [input.projectId.trim()];

  const output = await asanaRequest<AsanaTask>("/tasks", token, {
    method: "POST",
    body: JSON.stringify({ data }),
  });
  return { providerId: ASANA_PROVIDER_ID, tool: "create_task", output };
}

export async function closeAsanaTask(token: string, taskId: string): Promise<IntegrationToolResult> {
  const normalizedId = taskId.trim();
  if (!normalizedId) throw new Error("O ID da tarefa do Asana é obrigatório.");

  const output = await asanaRequest<AsanaTask>(`/tasks/${encodeURIComponent(normalizedId)}`, token, {
    method: "PUT",
    body: JSON.stringify({ data: { completed: true } }),
  });
  return { providerId: ASANA_PROVIDER_ID, tool: "close_task", output };
}

export async function revokeAsanaAccessToken(token: string): Promise<void> {
  const response = await fetch(ASANA_OAUTH_REVOKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    cache: "no-store",
    body: new URLSearchParams({ token: token.trim() }),
  });
  if (!response.ok && response.status !== 400) {
    throw new AsanaConnectionError("Não foi possível revogar a autorização do Asana.", "provider_error");
  }
}
