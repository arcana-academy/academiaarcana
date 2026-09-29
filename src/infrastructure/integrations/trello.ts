import type {
  IntegrationDefinition,
  IntegrationToolResult,
} from "./contracts";

export const TRELLO_PROVIDER_ID = "trello" as const;
export const TRELLO_PLUGIN_NAME = "Trello" as const;
export const TRELLO_API_BASE_URL = "https://api.trello.com/1" as const;
export const TRELLO_OAUTH_AUTHORIZE_URL = "https://auth.atlassian.com/authorize" as const;
export const TRELLO_OAUTH_TOKEN_URL = "https://auth.atlassian.com/oauth/token" as const;

export const TRELLO_CREDENTIALS_COOKIE = "__Host-aa-trello-credentials" as const;
export const TRELLO_OAUTH_STATE_COOKIE = "__Host-aa-trello-state" as const;
export const TRELLO_OAUTH_PKCE_COOKIE = "__Host-aa-trello-pkce" as const;

export const TRELLO_OAUTH_SCOPE = [
  "read:member:trello",
  "read:board:trello",
  "write:board:trello",
  "offline_access",
].join(" ");

export const TRELLO_INTEGRATION_DEFINITION = {
  id: TRELLO_PROVIDER_ID,
  displayName: TRELLO_PLUGIN_NAME,
  authMode: "oauth2",
  capabilities: ["read", "write", "search", "metadata"],
  userConnectionRequired: true,
  serverSideOnly: true,
  scopes: TRELLO_OAUTH_SCOPE.split(" "),
  documentationUrl:
    "https://developer.atlassian.com/cloud/trello/guides/rest-api/oauth-2-getting-started/",
} satisfies IntegrationDefinition;

export type TrelloMember = {
  readonly id: string;
  readonly fullName?: string;
  readonly username?: string;
  readonly email?: string;
  readonly url?: string;
};

export type TrelloBoard = {
  readonly id: string;
  readonly name: string;
  readonly desc?: string;
  readonly url: string;
  readonly closed: boolean;
};

export type TrelloList = {
  readonly id: string;
  readonly idBoard: string;
  readonly name: string;
  readonly pos: number;
  readonly closed: boolean;
};

export type TrelloLabel = {
  readonly id: string;
  readonly name: string;
  readonly color?: string | null;
};

export type TrelloCard = {
  readonly id: string;
  readonly idBoard: string;
  readonly idList: string;
  readonly name: string;
  readonly desc?: string;
  readonly due?: string | null;
  readonly closed: boolean;
  readonly pos: number;
  readonly url: string;
  readonly idLabels?: readonly string[];
  readonly labels?: readonly TrelloLabel[];
};

export type TrelloCheckItem = {
  readonly id: string;
  readonly idChecklist?: string;
  readonly name: string;
  readonly state: "complete" | "incomplete";
  readonly pos?: number;
};

export type TrelloChecklist = {
  readonly id: string;
  readonly name: string;
  readonly pos?: number;
  readonly checkItems?: readonly TrelloCheckItem[];
};

export type TrelloTokenSet = {
  readonly accessToken: string;
  readonly refreshToken: string | null;
  readonly accessTokenExpiresAt: number | null;
};

export type TrelloCredentials = TrelloTokenSet & {
  readonly subjectId: string;
};

export type TrelloConnectionVerification = {
  readonly providerId: typeof TRELLO_PROVIDER_ID;
  readonly pluginName: typeof TRELLO_PLUGIN_NAME;
  readonly status: "connected";
  readonly user: TrelloMember;
  readonly verifiedAt: string;
};

export class TrelloConnectionError extends Error {
  constructor(message = "Trello não está configurado ou autorizado.") {
    super(message);
    this.name = "TrelloConnectionError";
  }
}

export function getTrelloClientId(): string {
  const value = process.env.TRELLO_CLIENT_ID?.trim();
  if (!value) throw new TrelloConnectionError("TRELLO_CLIENT_ID não está configurado.");
  return value;
}

export function getTrelloClientSecret(): string {
  const value = process.env.TRELLO_CLIENT_SECRET?.trim();
  if (!value) throw new TrelloConnectionError("TRELLO_CLIENT_SECRET não está configurado.");
  return value;
}

export function getTrelloRedirectUri(requestUrl?: string): string {
  const configured = process.env.TRELLO_REDIRECT_URI?.trim();
  if (configured) return configured;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) return new URL("/api/integrations/trello/callback", appUrl).toString();

  if (process.env.NODE_ENV !== "production" && requestUrl) {
    return new URL("/api/integrations/trello/callback", requestUrl).toString();
  }

  throw new TrelloConnectionError(
    "Defina TRELLO_REDIRECT_URI (ou NEXT_PUBLIC_APP_URL) antes de conectar o Trello.",
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return globalThis.btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded =
    value.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((value.length + 3) % 4);
  const binary = globalThis.atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function getCookieKey(): Promise<CryptoKey> {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(getTrelloClientSecret()),
  );

  return globalThis.crypto.subtle.importKey(
    "raw",
    digest,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptTrelloCredentials(credentials: TrelloCredentials): Promise<string> {
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

export async function decryptTrelloCredentials(
  value?: string | null,
): Promise<TrelloCredentials | null> {
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

    const parsed = JSON.parse(new TextDecoder().decode(plaintext)) as Partial<TrelloCredentials>;
    if (
      typeof parsed.subjectId !== "string" ||
      !parsed.subjectId ||
      typeof parsed.accessToken !== "string" ||
      !parsed.accessToken ||
      (parsed.refreshToken !== null && typeof parsed.refreshToken !== "string") ||
      (parsed.accessTokenExpiresAt !== null && typeof parsed.accessTokenExpiresAt !== "number")
    ) {
      return null;
    }

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

export function shouldRefreshTrelloCredentials(
  credentials: TrelloCredentials,
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

export function buildTrelloAuthorizationUrl(input: {
  readonly state: string;
  readonly codeChallenge: string;
  readonly requestUrl?: string;
}): string {
  const params = new URLSearchParams({
    client_id: getTrelloClientId(),
    scope: TRELLO_OAUTH_SCOPE,
    redirect_uri: getTrelloRedirectUri(input.requestUrl),
    state: input.state,
    response_type: "code",
    prompt: "consent",
    code_challenge: input.codeChallenge,
    code_challenge_method: "S256",
  });

  return `${TRELLO_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

async function trelloRequest<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const normalizedToken = token.trim();
  if (!normalizedToken) throw new TrelloConnectionError();

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${normalizedToken}`);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${TRELLO_API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new TrelloConnectionError(
        "A autorização do Trello expirou ou foi revogada. Reconecte a conta.",
      );
    }
    throw new TrelloConnectionError(`Trello API respondeu com HTTP ${response.status}.`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function exchangeTrelloAuthorizationCode(input: {
  readonly code: string;
  readonly codeVerifier: string;
  readonly requestUrl?: string;
}): Promise<TrelloTokenSet> {
  const response = await fetch(TRELLO_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: getTrelloClientId(),
      client_secret: getTrelloClientSecret(),
      code: input.code,
      redirect_uri: getTrelloRedirectUri(input.requestUrl),
      code_verifier: input.codeVerifier,
    }),
  });

  if (!response.ok) throw new TrelloConnectionError("Não foi possível concluir a autorização do Trello.");

  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (!payload.access_token) {
    throw new TrelloConnectionError("O Trello não devolveu um token de acesso válido.");
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    accessTokenExpiresAt:
      typeof payload.expires_in === "number" ? Date.now() + payload.expires_in * 1000 : null,
  };
}

export async function refreshTrelloCredentials(
  credentials: TrelloCredentials,
): Promise<TrelloCredentials> {
  if (!credentials.refreshToken) {
    throw new TrelloConnectionError("A autorização do Trello não possui refresh token. Reconecte a conta.");
  }

  const response = await fetch(TRELLO_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: getTrelloClientId(),
      client_secret: getTrelloClientSecret(),
      refresh_token: credentials.refreshToken,
    }),
  });

  if (!response.ok) throw new TrelloConnectionError("Não foi possível renovar a autorização do Trello.");

  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (!payload.access_token) {
    throw new TrelloConnectionError("O Trello não devolveu um token renovado válido.");
  }

  return {
    subjectId: credentials.subjectId,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? credentials.refreshToken,
    accessTokenExpiresAt:
      typeof payload.expires_in === "number" ? Date.now() + payload.expires_in * 1000 : null,
  };
}

export async function verifyTrelloConnection(
  token: string,
): Promise<TrelloConnectionVerification> {
  const user = await trelloRequest<TrelloMember>("/members/me?fields=id,fullName,username,email,url", token);
  return {
    providerId: TRELLO_PROVIDER_ID,
    pluginName: TRELLO_PLUGIN_NAME,
    status: "connected",
    user,
    verifiedAt: new Date().toISOString(),
  };
}

export async function getTrelloBoards(token: string): Promise<IntegrationToolResult> {
  return {
    providerId: TRELLO_PROVIDER_ID,
    tool: "list_boards",
    output: await trelloRequest<TrelloBoard[]>(
      "/members/me/boards?filter=open&fields=id,name,desc,url,closed",
      token,
    ),
  };
}

export async function getTrelloBoard(token: string, boardId: string): Promise<IntegrationToolResult> {
  const id = boardId.trim();
  if (!id) throw new Error("O ID do board do Trello é obrigatório.");
  return {
    providerId: TRELLO_PROVIDER_ID,
    tool: "get_board",
    output: await trelloRequest<TrelloBoard>(`/boards/${encodeURIComponent(id)}?fields=id,name,desc,url,closed`, token),
  };
}

export async function getTrelloLists(token: string, boardId: string): Promise<IntegrationToolResult> {
  const id = boardId.trim();
  if (!id) throw new Error("O ID do board do Trello é obrigatório.");
  return {
    providerId: TRELLO_PROVIDER_ID,
    tool: "list_lists",
    output: await trelloRequest<TrelloList[]>(
      `/boards/${encodeURIComponent(id)}/lists?filter=open&fields=id,idBoard,name,pos,closed`,
      token,
    ),
  };
}

export async function getTrelloCards(token: string, boardId: string): Promise<IntegrationToolResult> {
  const id = boardId.trim();
  if (!id) throw new Error("O ID do board do Trello é obrigatório.");
  return {
    providerId: TRELLO_PROVIDER_ID,
    tool: "list_cards",
    output: await trelloRequest<TrelloCard[]>(
      `/boards/${encodeURIComponent(id)}/cards?filter=open&fields=id,idBoard,idList,name,desc,due,closed,pos,url,idLabels,labels`,
      token,
    ),
  };
}

export async function searchTrello(token: string, query: string): Promise<IntegrationToolResult> {
  const normalized = query.trim();
  if (!normalized) throw new Error("A busca do Trello não pode estar vazia.");
  return {
    providerId: TRELLO_PROVIDER_ID,
    tool: "search",
    output: await trelloRequest<{ cards?: TrelloCard[]; boards?: TrelloBoard[] }>(
      `/search?query=${encodeURIComponent(normalized)}&modelTypes=cards,boards&cards_limit=50&boards_limit=50`,
      token,
    ),
  };
}

export async function createTrelloBoard(
  token: string,
  input: { readonly name: string; readonly description?: string },
): Promise<IntegrationToolResult> {
  const name = input.name.trim();
  if (!name) throw new Error("O nome do board do Trello é obrigatório.");
  const params = new URLSearchParams({ name, defaultLists: "false" });
  if (input.description?.trim()) params.set("desc", input.description.trim());
  return {
    providerId: TRELLO_PROVIDER_ID,
    tool: "create_board",
    output: await trelloRequest<TrelloBoard>(`/boards/?${params.toString()}`, token, { method: "POST" }),
  };
}

export async function createTrelloList(
  token: string,
  input: { readonly boardId: string; readonly name: string; readonly pos?: "top" | "bottom" | number },
): Promise<IntegrationToolResult> {
  const boardId = input.boardId.trim();
  const name = input.name.trim();
  if (!boardId || !name) throw new Error("Board e nome da lista são obrigatórios.");
  const params = new URLSearchParams({ name, idBoard: boardId });
  if (input.pos !== undefined) params.set("pos", String(input.pos));
  return {
    providerId: TRELLO_PROVIDER_ID,
    tool: "create_list",
    output: await trelloRequest<TrelloList>(`/lists?${params.toString()}`, token, { method: "POST" }),
  };
}

export async function createTrelloCard(
  token: string,
  input: {
    readonly listId: string;
    readonly name: string;
    readonly description?: string;
    readonly due?: string | null;
  },
): Promise<IntegrationToolResult> {
  const listId = input.listId.trim();
  const name = input.name.trim();
  if (!listId || !name) throw new Error("Lista e nome do card são obrigatórios.");
  const body: Record<string, unknown> = { idList: listId, name };
  if (input.description?.trim()) body.desc = input.description.trim();
  if (input.due) body.due = input.due;
  return {
    providerId: TRELLO_PROVIDER_ID,
    tool: "create_card",
    output: await trelloRequest<TrelloCard>("/cards", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  };
}

export async function updateTrelloCard(
  token: string,
  cardId: string,
  input: {
    readonly name?: string;
    readonly description?: string;
    readonly due?: string | null;
    readonly listId?: string;
    readonly closed?: boolean;
  },
): Promise<IntegrationToolResult> {
  const id = cardId.trim();
  if (!id) throw new Error("O ID do card do Trello é obrigatório.");
  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.name = input.name.trim();
  if (input.description !== undefined) body.desc = input.description;
  if (input.due !== undefined) body.due = input.due;
  if (input.listId !== undefined) body.idList = input.listId;
  if (input.closed !== undefined) body.closed = input.closed;
  if (!Object.keys(body).length) throw new Error("Nenhuma alteração de card foi informada.");
  return {
    providerId: TRELLO_PROVIDER_ID,
    tool: "update_card",
    output: await trelloRequest<TrelloCard>(`/cards/${encodeURIComponent(id)}`, token, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  };
}

export async function getTrelloChecklists(token: string, cardId: string): Promise<IntegrationToolResult> {
  const id = cardId.trim();
  if (!id) throw new Error("O ID do card do Trello é obrigatório.");
  return {
    providerId: TRELLO_PROVIDER_ID,
    tool: "list_checklists",
    output: await trelloRequest<TrelloChecklist[]>(
      `/cards/${encodeURIComponent(id)}/checklists?checkItems=all&fields=id,name,pos&checkItem_fields=id,idChecklist,name,state,pos`,
      token,
    ),
  };
}

export async function createTrelloChecklist(
  token: string,
  input: { readonly cardId: string; readonly name: string },
): Promise<IntegrationToolResult> {
  const cardId = input.cardId.trim();
  const name = input.name.trim();
  if (!cardId || !name) throw new Error("Card e nome da checklist são obrigatórios.");
  const params = new URLSearchParams({ idCard: cardId, name });
  return {
    providerId: TRELLO_PROVIDER_ID,
    tool: "create_checklist",
    output: await trelloRequest<TrelloChecklist>(`/checklists?${params.toString()}`, token, { method: "POST" }),
  };
}

export async function addTrelloChecklistItem(
  token: string,
  input: { readonly checklistId: string; readonly name: string; readonly checked?: boolean },
): Promise<IntegrationToolResult> {
  const checklistId = input.checklistId.trim();
  const name = input.name.trim();
  if (!checklistId || !name) throw new Error("Checklist e nome do item são obrigatórios.");
  const params = new URLSearchParams({ name, checked: String(Boolean(input.checked)) });
  return {
    providerId: TRELLO_PROVIDER_ID,
    tool: "add_checklist_item",
    output: await trelloRequest<TrelloCheckItem>(
      `/checklists/${encodeURIComponent(checklistId)}/checkItems?${params.toString()}`,
      token,
      { method: "POST" },
    ),
  };
}

export async function updateTrelloChecklistItem(
  token: string,
  input: { readonly cardId: string; readonly itemId: string; readonly checked?: boolean; readonly name?: string },
): Promise<IntegrationToolResult> {
  const cardId = input.cardId.trim();
  const itemId = input.itemId.trim();
  if (!cardId || !itemId) throw new Error("Card e item da checklist são obrigatórios.");

  const params = new URLSearchParams();
  if (input.checked !== undefined) params.set("state", input.checked ? "complete" : "incomplete");
  if (input.name?.trim()) params.set("name", input.name.trim());

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return {
    providerId: TRELLO_PROVIDER_ID,
    tool: "update_checklist_item",
    output: await trelloRequest<TrelloCheckItem>(
      `/cards/${encodeURIComponent(cardId)}/checkItem/${encodeURIComponent(itemId)}${suffix}`,
      token,
      { method: "PUT" },
    ),
  };
}
