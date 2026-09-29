import type { IntegrationDefinition, IntegrationToolResult } from "./contracts";

export const AIRTABLE_PROVIDER_ID = "airtable" as const;
export const AIRTABLE_PLUGIN_NAME = "Airtable" as const;
export const AIRTABLE_API_BASE_URL = "https://api.airtable.com/v0" as const;
export const AIRTABLE_META_API_BASE_URL = "https://api.airtable.com/v0/meta" as const;

export const AIRTABLE_INTEGRATION_DEFINITION = {
  id: AIRTABLE_PROVIDER_ID,
  displayName: AIRTABLE_PLUGIN_NAME,
  authMode: "api_key",
  capabilities: ["read", "write", "search", "metadata", "analytics"],
  userConnectionRequired: false,
  serverSideOnly: true,
  scopes: [],
  documentationUrl: "https://airtable.com/developers/web/api/introduction",
} satisfies IntegrationDefinition;

export type AirtableConnectionVerification = {
  readonly providerId: typeof AIRTABLE_PROVIDER_ID;
  readonly status: "connected";
  readonly baseId: string;
  readonly tableCount: number;
  readonly verifiedAt: string;
};

export type AirtableRecord = {
  readonly id: string;
  readonly createdTime?: string;
  readonly fields: Record<string, unknown>;
};

export class AirtableConnectionError extends Error {
  constructor(message = "Airtable não está configurado ou autorizado.") {
    super(message);
    this.name = "AirtableConnectionError";
  }
}

export function getAirtableApiKey(): string {
  const value = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN?.trim();
  if (!value) throw new AirtableConnectionError("AIRTABLE_PERSONAL_ACCESS_TOKEN não está configurado.");
  return value;
}

export function getAirtableBaseId(): string {
  const value = process.env.AIRTABLE_BASE_ID?.trim();
  if (!value) throw new AirtableConnectionError("AIRTABLE_BASE_ID não está configurado.");
  return value;
}

async function airtableFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", "Bearer " + getAirtableApiKey());
  headers.set("Accept", "application/json");
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new AirtableConnectionError("A autorização do Airtable foi rejeitada ou não possui acesso à base configurada.");
    }
    throw new AirtableConnectionError("Airtable API respondeu com HTTP " + response.status + ".");
  }
  return (await response.json()) as T;
}

export async function verifyAirtableConnection(): Promise<AirtableConnectionVerification> {
  const baseId = getAirtableBaseId();
  const output = await airtableFetch<{ tables?: Array<{ id: string; name: string }> }>(
    AIRTABLE_META_API_BASE_URL + "/bases/" + encodeURIComponent(baseId) + "/tables",
  );
  return {
    providerId: AIRTABLE_PROVIDER_ID,
    status: "connected",
    baseId,
    tableCount: output.tables?.length ?? 0,
    verifiedAt: new Date().toISOString(),
  };
}

export async function listAirtableRecords(tableIdOrName: string, options: {
  readonly pageSize?: number;
  readonly offset?: string;
  readonly maxRecords?: number;
} = {}): Promise<IntegrationToolResult> {
  const table = tableIdOrName.trim();
  if (!table) throw new Error("A tabela do Airtable é obrigatória.");
  const params = new URLSearchParams();
  if (options.pageSize) params.set("pageSize", String(Math.min(options.pageSize, 100)));
  if (options.offset) params.set("offset", options.offset);
  if (options.maxRecords) params.set("maxRecords", String(Math.min(options.maxRecords, 100)));
  const query = params.toString();
  const output = await airtableFetch<{ records?: AirtableRecord[]; offset?: string }>(
    AIRTABLE_API_BASE_URL + "/" + encodeURIComponent(getAirtableBaseId()) + "/" + encodeURIComponent(table) + (query ? "?" + query : ""),
  );
  return { providerId: AIRTABLE_PROVIDER_ID, tool: "list_records", output: { records: output.records ?? [], offset: output.offset ?? null } };
}

export async function createAirtableRecords(tableIdOrName: string, records: ReadonlyArray<{ readonly fields: Record<string, unknown> }>): Promise<IntegrationToolResult> {
  const table = tableIdOrName.trim();
  if (!table) throw new Error("A tabela do Airtable é obrigatória.");
  if (records.length === 0) throw new Error("É necessário informar pelo menos um registro.");
  if (records.length > 10) throw new Error("O lote do Airtable deve conter no máximo 10 registros.");
  const output = await airtableFetch<{ records?: AirtableRecord[] }>(
    AIRTABLE_API_BASE_URL + "/" + encodeURIComponent(getAirtableBaseId()) + "/" + encodeURIComponent(table),
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records }) },
  );
  return { providerId: AIRTABLE_PROVIDER_ID, tool: "create_records", output: output.records ?? [] };
}