import type {
  IntegrationDefinition,
  IntegrationToolResult,
} from "./contracts";

export const DROPBOX_PROVIDER_ID = "dropbox" as const;
export const DROPBOX_PLUGIN_NAME = "Dropbox" as const;
export const DROPBOX_API_BASE_URL = "https://api.dropboxapi.com/2" as const;

export const DROPBOX_INTEGRATION_DEFINITION = {
  id: DROPBOX_PROVIDER_ID,
  displayName: DROPBOX_PLUGIN_NAME,
  authMode: "service_token",
  capabilities: ["read", "search", "files"],
  userConnectionRequired: false,
  serverSideOnly: true,
  scopes: ["files.metadata.read", "files.content.read"],
  documentationUrl: "https://www.dropbox.com/developers/documentation/http/documentation",
} satisfies IntegrationDefinition;

export type DropboxOperation = "list_folder" | "search" | "get_metadata";

export class DropboxConnectionError extends Error {
  constructor(message = "Dropbox não está configurado ou autorizado.") {
    super(message);
    this.name = "DropboxConnectionError";
  }
}

function getServerToken(token = process.env.DROPBOX_RUNTIME_TOKEN): string {
  if (!token?.trim()) throw new DropboxConnectionError();
  return token.trim();
}

async function request<T>(path: string, input: Record<string, unknown>, token: string): Promise<T> {
  const response = await fetch(`${DROPBOX_API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new DropboxConnectionError(`Dropbox API respondeu com HTTP ${response.status}.`);
  }

  return (await response.json()) as T;
}

export async function verifyDropboxConnection(
  token = process.env.DROPBOX_RUNTIME_TOKEN,
): Promise<{ providerId: typeof DROPBOX_PROVIDER_ID; accountId: string; verifiedAt: string }> {
  const account = await request<{ account_id: string }>(
    "/users/get_current_account",
    {},
    getServerToken(token),
  );

  return {
    providerId: DROPBOX_PROVIDER_ID,
    accountId: account.account_id,
    verifiedAt: new Date().toISOString(),
  };
}

export async function executeDropboxRequest(
  operation: DropboxOperation,
  input: Record<string, unknown>,
  token = process.env.DROPBOX_RUNTIME_TOKEN,
): Promise<IntegrationToolResult> {
  const output = await request<unknown>(
    `/files/${operation}`,
    input,
    getServerToken(token),
  );

  return { providerId: DROPBOX_PROVIDER_ID, tool: operation, output };
}

export async function listDropboxFolder(path = "", token = process.env.DROPBOX_RUNTIME_TOKEN) {
  return executeDropboxRequest("list_folder", { path, recursive: false }, token);
}

export async function searchDropbox(query: string, token = process.env.DROPBOX_RUNTIME_TOKEN) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) throw new Error("A busca do Dropbox não pode estar vazia.");
  return executeDropboxRequest("search", { query: normalizedQuery }, token);
}
