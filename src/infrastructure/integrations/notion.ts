import type { IntegrationDefinition, IntegrationToolResult } from "./contracts";

export const NOTION_PROVIDER_ID = "notion" as const;
export const NOTION_PLUGIN_NAME = "Notion" as const;
export const NOTION_API_BASE_URL = "https://api.notion.com/v1" as const;
export const NOTION_API_VERSION = "2026-03-11" as const;
export const NOTION_OAUTH_AUTHORIZE_URL =
  "https://api.notion.com/v1/oauth/authorize" as const;
export const NOTION_OAUTH_TOKEN_URL =
  "https://api.notion.com/v1/oauth/token" as const;
export const NOTION_OAUTH_REVOKE_URL =
  "https://api.notion.com/v1/oauth/revoke" as const;

export const NOTION_CREDENTIALS_COOKIE = "aa-notion-credentials" as const;
export const NOTION_OAUTH_STATE_COOKIE = "aa-notion-state" as const;

export const NOTION_INTEGRATION_DEFINITION = {
  id: NOTION_PROVIDER_ID,
  displayName: NOTION_PLUGIN_NAME,
  authMode: "oauth2",
  capabilities: ["read", "write", "search", "files", "metadata"],
  userConnectionRequired: true,
  serverSideOnly: true,
  scopes: [],
  documentationUrl: "https://developers.notion.com/",
} satisfies IntegrationDefinition;

export type NotionTokenSet = {
  readonly accessToken: string;
  readonly refreshToken: string | null;
  readonly botId: string | null;
  readonly workspaceId: string | null;
  readonly workspaceName: string | null;
};

export type NotionCredentials = NotionTokenSet & {
  readonly subjectId: string;
};

export type NotionUser = {
  readonly id: string;
  readonly name: string | null;
  readonly type: string | null;
};

export type NotionConnectionVerification = {
  readonly providerId: typeof NOTION_PROVIDER_ID;
  readonly pluginName: typeof NOTION_PLUGIN_NAME;
  readonly status: "connected";
  readonly user: NotionUser;
  readonly workspace: {
    readonly id: string | null;
    readonly name: string | null;
  };
  readonly verifiedAt: string;
};

export type NotionSearchResult = {
  readonly id: string;
  readonly title: string;
  readonly url: string | null;
  readonly lastEditedTime: string | null;
};

export type NotionPageResult = {
  readonly id: string;
  readonly title: string;
  readonly url: string | null;
};

export class NotionConnectionError extends Error {
  readonly code: "not_configured" | "reauthorization_required" | "request_failed";

  constructor(
    message: string,
    code: NotionConnectionError["code"] = "request_failed",
  ) {
    super(message);
    this.name = "NotionConnectionError";
    this.code = code;
  }
}

function requireEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new NotionConnectionError(
      `${name} não está configurado.`,
      "not_configured",
    );
  }
  return value;
}

export function getNotionClientId(): string {
  return requireEnvironment("NOTION_CLIENT_ID");
}

export function getNotionClientSecret(): string {
  return requireEnvironment("NOTION_CLIENT_SECRET");
}

export function getNotionRedirectUri(requestUrl?: string): string {
  const configured = process.env.NOTION_REDIRECT_URI?.trim();
  if (configured) return configured;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    return new URL("/api/integrations/notion/callback", appUrl).toString();
  }

  if (process.env.NODE_ENV !== "production" && requestUrl) {
    return new URL(
      "/api/integrations/notion/callback",
      requestUrl,
    ).toString();
  }

  throw new NotionConnectionError(
    "Defina NOTION_REDIRECT_URI (ou NEXT_PUBLIC_APP_URL) antes de conectar o Notion.",
    "not_configured",
  );
}

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromBase64Url(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value, "base64url"));
}

async function getCookieKey(): Promise<CryptoKey> {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(getNotionClientSecret()),
  );

  return globalThis.crypto.subtle.importKey(
    "raw",
    digest,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptNotionCredentials(
  credentials: NotionCredentials,
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

export async function decryptNotionCredentials(
  value?: string | null,
): Promise<NotionCredentials | null> {
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

    const parsed = JSON.parse(
      new TextDecoder().decode(plaintext),
    ) as Partial<NotionCredentials>;

    if (
      typeof parsed.subjectId !== "string" ||
      !parsed.subjectId ||
      typeof parsed.accessToken !== "string" ||
      !parsed.accessToken
    ) {
      return null;
    }

    return {
      subjectId: parsed.subjectId,
      accessToken: parsed.accessToken,
      refreshToken:
        parsed.refreshToken === null || typeof parsed.refreshToken === "string"
          ? parsed.refreshToken ?? null
          : null,
      botId:
        parsed.botId === null || typeof parsed.botId === "string"
          ? parsed.botId ?? null
          : null,
      workspaceId:
        parsed.workspaceId === null || typeof parsed.workspaceId === "string"
          ? parsed.workspaceId ?? null
          : null,
      workspaceName:
        parsed.workspaceName === null || typeof parsed.workspaceName === "string"
          ? parsed.workspaceName ?? null
          : null,
    };
  } catch {
    return null;
  }
}

export function createNotionOAuthState(): string {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

export function buildNotionAuthorizationUrl(input: {
  readonly state: string;
  readonly requestUrl?: string;
}): string {
  const params = new URLSearchParams({
    client_id: getNotionClientId(),
    redirect_uri: getNotionRedirectUri(input.requestUrl),
    response_type: "code",
    owner: "user",
    state: input.state,
  });

  return `${NOTION_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

function basicAuthorizationHeader(): string {
  return `Basic ${Buffer.from(
    `${getNotionClientId()}:${getNotionClientSecret()}`,
  ).toString("base64")}`;
}

export async function exchangeNotionAuthorizationCode(input: {
  readonly code: string;
  readonly requestUrl?: string;
}): Promise<NotionTokenSet> {
  const response = await fetch(NOTION_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthorizationHeader(),
      "Content-Type": "application/json",
      "Notion-Version": NOTION_API_VERSION,
    },
    cache: "no-store",
    body: JSON.stringify({
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: getNotionRedirectUri(input.requestUrl),
    }),
  });

  if (!response.ok) {
    throw new NotionConnectionError(
      "Não foi possível concluir a autorização do Notion.",
      "reauthorization_required",
    );
  }

  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    bot_id?: string;
    workspace_id?: string;
    workspace_name?: string;
  };

  if (!payload.access_token) {
    throw new NotionConnectionError(
      "O Notion não devolveu um token de acesso válido.",
      "reauthorization_required",
    );
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    botId: payload.bot_id ?? null,
    workspaceId: payload.workspace_id ?? null,
    workspaceName: payload.workspace_name ?? null,
  };
}

export async function refreshNotionCredentials(
  credentials: NotionCredentials,
): Promise<NotionCredentials> {
  if (!credentials.refreshToken) {
    throw new NotionConnectionError(
      "A conexão do Notion não possui refresh token. Reconecte a conta.",
      "reauthorization_required",
    );
  }

  const response = await fetch(NOTION_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthorizationHeader(),
      "Content-Type": "application/json",
      "Notion-Version": NOTION_API_VERSION,
    },
    cache: "no-store",
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: credentials.refreshToken,
    }),
  });

  if (!response.ok) {
    throw new NotionConnectionError(
      "Não foi possível renovar a autorização do Notion.",
      "reauthorization_required",
    );
  }

  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    bot_id?: string;
    workspace_id?: string;
    workspace_name?: string;
  };

  if (!payload.access_token) {
    throw new NotionConnectionError(
      "O Notion não devolveu um token renovado válido.",
      "reauthorization_required",
    );
  }

  return {
    subjectId: credentials.subjectId,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? credentials.refreshToken,
    botId: payload.bot_id ?? credentials.botId,
    workspaceId: payload.workspace_id ?? credentials.workspaceId,
    workspaceName: payload.workspace_name ?? credentials.workspaceName,
  };
}

async function notionRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  if (!token.trim()) {
    throw new NotionConnectionError(
      "A autorização do Notion está ausente.",
      "reauthorization_required",
    );
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token.trim()}`);
  headers.set("Accept", "application/json");
  headers.set("Notion-Version", NOTION_API_VERSION);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${NOTION_API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (response.status === 401 || response.status === 403) {
    throw new NotionConnectionError(
      "A autorização do Notion expirou, foi revogada ou não possui acesso suficiente.",
      "reauthorization_required",
    );
  }

  if (!response.ok) {
    throw new NotionConnectionError(
      `Notion API respondeu com HTTP ${response.status}.`,
      "request_failed",
    );
  }

  return (await response.json()) as T;
}

export async function verifyNotionConnection(
  token: string,
): Promise<NotionConnectionVerification> {
  const user = await notionRequest<{
    id: string;
    type?: string;
    name?: string | null;
  }>("/users/me", token);

  const tokenMetadata = await notionRequest<{
    bot_id?: string;
  }>("/users/me", token);

  return {
    providerId: NOTION_PROVIDER_ID,
    pluginName: NOTION_PLUGIN_NAME,
    status: "connected",
    user: {
      id: user.id,
      name: user.name ?? null,
      type: user.type ?? null,
    },
    workspace: {
      id: tokenMetadata.bot_id ? null : null,
      name: null,
    },
    verifiedAt: new Date().toISOString(),
  };
}

function extractPageTitle(page: {
  readonly properties?: Record<
    string,
    {
      readonly type?: string;
      readonly title?: readonly {
        readonly plain_text?: string;
        readonly text?: { readonly content?: string };
      }[];
    }
  >;
}): string {
  const property = Object.values(page.properties ?? {}).find(
    (candidate) => candidate.type === "title" && Array.isArray(candidate.title),
  );
  const title = property?.title
    ?.map((part) => part.plain_text ?? part.text?.content ?? "")
    .join("")
    .trim();

  return title || "Página sem título";
}

export async function searchNotion(
  token: string,
  query = "",
): Promise<IntegrationToolResult> {
  const normalizedQuery = query.trim();
  const output = await notionRequest<{
    results?: {
      id: string;
      object?: string;
      url?: string | null;
      last_edited_time?: string | null;
      properties?: Record<
        string,
        {
          type?: string;
          title?: readonly {
            plain_text?: string;
            text?: { content?: string };
          }[];
        }
      >;
    }[];
  }>("/search", token, {
    method: "POST",
    body: JSON.stringify({
      query: normalizedQuery || undefined,
      page_size: 20,
      filter: {
        property: "object",
        value: "page",
      },
    }),
  });

  const results: NotionSearchResult[] = (output.results ?? []).map((page) => ({
    id: page.id,
    title: extractPageTitle(page),
    url: page.url ?? null,
    lastEditedTime: page.last_edited_time ?? null,
  }));

  return {
    providerId: NOTION_PROVIDER_ID,
    tool: "search_pages",
    output: results,
  };
}

export async function createNotionPage(
  token: string,
  input: {
    readonly parentPageId: string;
    readonly title: string;
    readonly body?: string;
  },
): Promise<IntegrationToolResult> {
  const parentPageId = input.parentPageId.trim();
  const title = input.title.trim();
  const body = input.body?.trim() ?? "";

  if (!parentPageId || !title) {
    throw new NotionConnectionError(
      "A página pai e o título são obrigatórios.",
      "request_failed",
    );
  }

  const children = body
    ? [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: { content: body.slice(0, 2000) },
              },
            ],
          },
        },
      ]
    : undefined;

  const output = await notionRequest<{
    id: string;
    url?: string | null;
  }>("/pages", token, {
    method: "POST",
    body: JSON.stringify({
      parent: { page_id: parentPageId },
      properties: {
        title: {
          title: [
            {
              type: "text",
              text: { content: title },
            },
          ],
        },
      },
      ...(children ? { children } : {}),
    }),
  });

  return {
    providerId: NOTION_PROVIDER_ID,
    tool: "create_page",
    output: {
      id: output.id,
      title,
      url: output.url ?? null,
    } satisfies NotionPageResult,
  };
}

export async function revokeNotionAccessToken(token: string): Promise<void> {
  const response = await fetch(NOTION_OAUTH_REVOKE_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthorizationHeader(),
      "Content-Type": "application/json",
      "Notion-Version": NOTION_API_VERSION,
    },
    cache: "no-store",
    body: JSON.stringify({ token: token.trim() }),
  });

  if (!response.ok) {
    throw new NotionConnectionError(
      "Não foi possível revogar a autorização do Notion.",
      "request_failed",
    );
  }
}
