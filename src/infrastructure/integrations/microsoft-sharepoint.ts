import type { IntegrationConnectionStatus, IntegrationDefinition, IntegrationToolResult } from "./contracts";

export const MICROSOFT_SHAREPOINT_PROVIDER_ID = "microsoft-sharepoint" as const;
export const MICROSOFT_SHAREPOINT_PLUGIN_NAME = "Microsoft SharePoint" as const;
export const MICROSOFT_GRAPH_API_BASE_URL = "https://graph.microsoft.com/v1.0" as const;

export const MICROSOFT_SHAREPOINT_INTEGRATION_DEFINITION = {
  id: MICROSOFT_SHAREPOINT_PROVIDER_ID,
  displayName: MICROSOFT_SHAREPOINT_PLUGIN_NAME,
  authMode: "oauth",
  capabilities: ["read", "search", "files", "versions", "metadata"],
  userConnectionRequired: true,
  serverSideOnly: true,
  scopes: ["Files.Read", "Sites.Read.All"],
  documentationUrl: "https://learn.microsoft.com/graph/api/resources/drive",
} satisfies IntegrationDefinition;

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
