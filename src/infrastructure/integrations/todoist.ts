import type {
  IntegrationDefinition,
  IntegrationToolResult,
  IntegrationConnectionStatus,
} from "./contracts";

export const TODOIST_PROVIDER_ID = "todoist" as const;
export const TODOIST_PLUGIN_NAME = "Todoist" as const;
export const TODOIST_API_BASE_URL = "https://api.todoist.com/api/v1" as const;
export const TODOIST_OAUTH_AUTHORIZE_URL = "https://app.todoist.com/oauth/authorize" as const;
export const TODOIST_OAUTH_TOKEN_URL = "https://api.todoist.com/oauth/access_token" as const;
export const TODOIST_OAUTH_REVOKE_URL = "https://api.todoist.com/api/v1/revoke" as const;

export const TODOIST_CREDENTIALS_COOKIE = "__Host-aa-todoist-credentials" as const;
export const TODOIST_OAUTH_STATE_COOKIE = "__Host-aa-todoist-state" as const;
export const TODOIST_OAUTH_PKCE_COOKIE = "__Host-aa-todoist-pkce" as const;

export const TODOIST_OAUTH_SCOPE = "data:read_write" as const;

export const TODOIST_INTEGRATION_DEFINITION = {
  id: TODOIST_PROVIDER_ID,
  displayName: TODOIST_PLUGIN_NAME,
  authMode: "oauth2",
  capabilities: ["read", "write", "search", "calendar"],
  userConnectionRequired: true,
  serverSideOnly: true,
  scopes: [TODOIST_OAUTH_SCOPE],
  documentationUrl: "https://developer.todoist.com/api/v1/",
} satisfies IntegrationDefinition;

export type TodoistConnectionStatus = Extract<
  IntegrationConnectionStatus,
  "disconnected" | "connected" | "error"
>;

export type TodoistUser = {
  readonly id: string;
  readonly fullName?: string;
  readonly email?: string;
};

export type TodoistTask = {
  readonly id: string;
  readonly content: string;
  readonly description?: string;
  readonly checked: boolean;
  readonly due?: {
    readonly date: string;
    readonly datetime?: string;
    readonly is_recurring?: boolean;
    readonly string?: string;
  } | null;
  readonly priority?: number;
  readonly project_id?: string;
  readonly section_id?: string;
  readonly parent_id?: string | null;
};

export type TodoistProject = {
  readonly id: string;
  readonly name: string;
  readonly color?: string;
  readonly is_favorite?: boolean;
};

export type TodoistCredentials = {
  readonly accessToken: string;
  readonly refreshToken: string | null;
  readonly accessTokenExpiresAt: number | null;
};

export type TodoistConnectionVerification = {
  readonly providerId: typeof TODOIST_PROVIDER_ID;
  readonly pluginName: typeof TODOIST_PLUGIN_NAME;
  readonly status: Extract<TodoistConnectionStatus, "connected">;
  readonly user: TodoistUser;
  readonly verifiedAt: string;
};

export class TodoistConnectionError extends Error {
  constructor(message = "Todoist não está configurado ou autorizado.") {
    super(message);
    this.name = "TodoistConnectionError";
  }
}

export function getTodoistClientId(): string {
  const value = process.env.TODOIST_CLIENT_ID?.trim();
  if (!value) {
    throw new TodoistConnectionError("TODOIST_CLIENT_ID não está configurado.");
  }
  return value;
}

export function getTodoistClientSecret(): string {
  const value = process.env.TODOIST_CLIENT_SECRET?.trim();
  if (!value) {
    throw new TodoistConnectionError("TODOIST_CLIENT_SECRET não está configurado.");
  }
  return value;
}

export function getTodoistRedirectUri(requestUrl?: string): string {
  const configured = process.env.TODOIST_REDIRECT_URI?.trim();
  if (configured) return configured;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    return new URL("/api/integrations/todoist/callback", appUrl).toString();
  }

  if (process.env.NODE_ENV !== "production" && requestUrl) {
    return new URL("/api/integrations/todoist/callback", requestUrl).toString();
  }

  throw new TodoistConnectionError(
    "Defina TODOIST_REDIRECT_URI (ou NEXT_PUBLIC_APP_URL) antes de conectar o Todoist.",
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return globalThis
    .btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "===".slice(
    (value.length + 3) % 4,
  );
  const binary = globalThis.atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function getCookieKey(): Promise<CryptoKey> {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(getTodoistClientSecret()),
  );

  return globalThis.crypto.subtle.importKey(
    "raw",
    digest,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptTodoistCredentials(
  credentials: TodoistCredentials,
): Promise<string> {
  const iv = new Uint8Array(12);
  globalThis.crypto.getRandomValues(iv);

  const plaintext = new TextEncoder().encode(JSON.stringify(credentials));
  const ciphertext = new Uint8Array(
    await globalThis.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      await getCookieKey(),
      plaintext,
    ),
  );

  const payload = new Uint8Array(iv.length + ciphertext.length);
  payload.set(iv);
  payload.set(ciphertext, iv.length);
  return toBase64Url(payload);
}

export async function decryptTodoistCredentials(
  value?: string | null,
): Promise<TodoistCredentials | null> {
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

    const parsed = JSON.parse(new TextDecoder().decode(plaintext)) as Partial<TodoistCredentials>;
    if (
      typeof parsed.accessToken !== "string" ||
      !parsed.accessToken ||
      (parsed.refreshToken !== null && typeof parsed.refreshToken !== "string") ||
      (parsed.accessTokenExpiresAt !== null && typeof parsed.accessTokenExpiresAt !== "number")
    ) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken ?? null,
      accessTokenExpiresAt: parsed.accessTokenExpiresAt ?? null,
    };
  } catch {
    return null;
  }
}

export function shouldRefreshTodoistCredentials(
  credentials: TodoistCredentials,
  now = Date.now(),
): boolean {
  return Boolean(
    credentials.refreshToken &&
      credentials.accessTokenExpiresAt !== null &&
      credentials.accessTokenExpiresAt - now <= 60_000,
  );
}

export function createOAuthVerifier(): string {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

export function createOAuthState(): string {
  return createOAuthVerifier();
}

export async function createPkceChallenge(verifier: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return toBase64Url(new Uint8Array(digest));
}

export function buildTodoistAuthorizationUrl(input: {
  readonly state: string;
  readonly codeChallenge: string;
  readonly requestUrl?: string;
}): string {
  const params = new URLSearchParams({
    client_id: getTodoistClientId(),
    scope: TODOIST_OAUTH_SCOPE,
    state: input.state,
    response_type: "code",
    redirect_uri: getTodoistRedirectUri(input.requestUrl),
    code_challenge: input.codeChallenge,
    code_challenge_method: "S256",
  });

  return `${TODOIST_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

async function todoistRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const normalizedToken = token.trim();
  if (!normalizedToken) throw new TodoistConnectionError();

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${normalizedToken}`);
  headers.set("Accept", "application/json");

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${TODOIST_API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new TodoistConnectionError(
        "A autorização do Todoist expirou ou foi revogada. Reconecte a conta.",
      );
    }

    throw new TodoistConnectionError(
      `Todoist API respondeu com HTTP ${response.status}.`,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function exchangeTodoistAuthorizationCode(input: {
  readonly code: string;
  readonly codeVerifier: string;
  readonly requestUrl?: string;
}): Promise<TodoistCredentials> {
  const response = await fetch(TODOIST_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    cache: "no-store",
    body: new URLSearchParams({
      client_id: getTodoistClientId(),
      client_secret: getTodoistClientSecret(),
      code: input.code,
      redirect_uri: getTodoistRedirectUri(input.requestUrl),
      grant_type: "authorization_code",
      code_verifier: input.codeVerifier,
    }),
  });

  if (!response.ok) {
    throw new TodoistConnectionError(
      "Não foi possível concluir a autorização do Todoist.",
    );
  }

  const payload = (await response.json()) as {
    access_token?: string;
    token_type?: string;
    expires_in?: number;
    refresh_token?: string;
  };

  if (!payload.access_token) {
    throw new TodoistConnectionError(
      "O Todoist não devolveu um token de acesso válido.",
    );
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    accessTokenExpiresAt:
      typeof payload.expires_in === "number"
        ? Date.now() + payload.expires_in * 1000
        : null,
  };
}

export async function refreshTodoistCredentials(
  credentials: TodoistCredentials,
): Promise<TodoistCredentials> {
  if (!credentials.refreshToken) {
    throw new TodoistConnectionError(
      "A autorização do Todoist não possui refresh token. Reconecte a conta.",
    );
  }

  const response = await fetch(TODOIST_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    cache: "no-store",
    body: new URLSearchParams({
      client_id: getTodoistClientId(),
      client_secret: getTodoistClientSecret(),
      grant_type: "refresh_token",
      refresh_token: credentials.refreshToken,
    }),
  });

  if (!response.ok) {
    throw new TodoistConnectionError(
      "Não foi possível renovar a autorização do Todoist.",
    );
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
  };

  if (!payload.access_token) {
    throw new TodoistConnectionError(
      "O Todoist não devolveu um token renovado válido.",
    );
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? credentials.refreshToken,
    accessTokenExpiresAt:
      typeof payload.expires_in === "number"
        ? Date.now() + payload.expires_in * 1000
        : null,
  };
}

export async function verifyTodoistConnection(
  token: string,
): Promise<TodoistConnectionVerification> {
  const user = await todoistRequest<TodoistUser>("/user", token);

  return {
    providerId: TODOIST_PROVIDER_ID,
    pluginName: TODOIST_PLUGIN_NAME,
    status: "connected",
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
    },
    verifiedAt: new Date().toISOString(),
  };
}

export async function getTodoistTasks(token: string): Promise<IntegrationToolResult> {
  const output = await todoistRequest<{
    results?: TodoistTask[];
    next_cursor?: string | null;
  }>("/tasks?limit=50", token);

  return {
    providerId: TODOIST_PROVIDER_ID,
    tool: "list_tasks",
    output: output.results ?? [],
  };
}

export async function searchTodoistTasks(
  token: string,
  query: string,
): Promise<IntegrationToolResult> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    throw new Error("A busca do Todoist não pode estar vazia.");
  }

  const output = await todoistRequest<{
    results?: TodoistTask[];
    next_cursor?: string | null;
  }>(`/tasks/filter?query=${encodeURIComponent(normalizedQuery)}&limit=50`, token);

  return {
    providerId: TODOIST_PROVIDER_ID,
    tool: "search_tasks",
    output: output.results ?? [],
  };
}

export async function getTodoistProjects(token: string): Promise<IntegrationToolResult> {
  const output = await todoistRequest<{
    results?: TodoistProject[];
    next_cursor?: string | null;
  }>("/projects?limit=50", token);

  return {
    providerId: TODOIST_PROVIDER_ID,
    tool: "list_projects",
    output: output.results ?? [],
  };
}

export async function createTodoistTask(
  token: string,
  input: {
    readonly content: string;
    readonly description?: string;
    readonly dueDateTime?: string | null;
    readonly projectId?: string | null;
    readonly priority?: 1 | 2 | 3 | 4;
    readonly labels?: readonly string[];
    readonly durationMinutes?: number | null;
  },
): Promise<IntegrationToolResult> {
  const content = input.content.trim();
  if (!content) throw new Error("A tarefa do Todoist não pode estar vazia.");

  const body: Record<string, unknown> = { content };
  if (input.description?.trim()) body.description = input.description.trim();
  if (input.dueDateTime) body.due_datetime = input.dueDateTime;
  if (input.projectId?.trim()) body.project_id = input.projectId.trim();
  if (input.priority) body.priority = input.priority;
  if (input.labels?.length) body.labels = [...input.labels];
  if (input.durationMinutes && input.durationMinutes > 0) {
    body.duration = Math.round(input.durationMinutes);
    body.duration_unit = "minute";
  }

  const output = await todoistRequest<TodoistTask>("/tasks", token, {
    method: "POST",
    body: JSON.stringify(body),
  });

  return {
    providerId: TODOIST_PROVIDER_ID,
    tool: "create_task",
    output,
  };
}

export async function closeTodoistTask(
  token: string,
  taskId: string,
): Promise<IntegrationToolResult> {
  const normalizedId = taskId.trim();
  if (!normalizedId) throw new Error("O ID da tarefa do Todoist é obrigatório.");

  await todoistRequest<undefined>(
    `/tasks/${encodeURIComponent(normalizedId)}/close`,
    token,
    { method: "POST" },
  );

  return {
    providerId: TODOIST_PROVIDER_ID,
    tool: "close_task",
    output: { taskId: normalizedId, closed: true },
  };
}

export async function revokeTodoistAccessToken(token: string): Promise<void> {
  const clientId = getTodoistClientId();
  const clientSecret = getTodoistClientSecret();

  const credentials = globalThis.btoa(`${clientId}:${clientSecret}`);
  const response = await fetch(TODOIST_OAUTH_REVOKE_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    cache: "no-store",
    body: new URLSearchParams({
      token: token.trim(),
      token_type_hint: "access_token",
    }),
  });

  if (!response.ok && response.status !== 400) {
    throw new TodoistConnectionError(
      "Não foi possível revogar a autorização do Todoist.",
    );
  }
}
