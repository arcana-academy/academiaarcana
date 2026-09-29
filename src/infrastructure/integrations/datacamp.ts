import type {
  IntegrationCapability,
  IntegrationDefinition,
  IntegrationToolRequest,
  IntegrationToolResult,
  ExternalIntegrationGateway,
} from "./contracts";

export const DATACAMP_PROVIDER_ID = "datacamp" as const;
export const DATACAMP_PLUGIN_NAME = "DataCamp" as const;
export const DATACAMP_CATALOG_API_BASE_URL =
  "https://lms-catalog-api.datacamp.com" as const;

export const DATACAMP_INTEGRATION_DEFINITION = {
  id: DATACAMP_PROVIDER_ID,
  displayName: DATACAMP_PLUGIN_NAME,
  authMode: "api_key",
  capabilities: ["read", "search", "analytics"] satisfies readonly IntegrationCapability[],
  userConnectionRequired: false,
  serverSideOnly: true,
  scopes: [],
  documentationUrl:
    "https://support.datacamp.com/hc/en-us/articles/14992652559255-Catalog-API-Integration",
} satisfies IntegrationDefinition;

export const DATACAMP_OPERATIONS = [
  "list_live_courses",
  "list_archived_courses",
  "list_live_projects",
  "list_archived_projects",
  "list_live_assessments",
  "list_archived_assessments",
  "list_live_practices",
  "list_archived_practices",
  "list_tracks",
  "list_custom_tracks",
  "list_completions",
  "list_started_courses",
] as const;

export type DataCampOperation = (typeof DATACAMP_OPERATIONS)[number];

export type DataCampRequest = {
  readonly operation: DataCampOperation;
  readonly input?: Record<string, unknown>;
};

export type DataCampConnectionVerification = {
  readonly providerId: typeof DATACAMP_PROVIDER_ID;
  readonly pluginName: typeof DATACAMP_PLUGIN_NAME;
  readonly status: "connected";
  readonly endpoint: string;
  readonly verifiedAt: string;
};

export class DataCampConnectionError extends Error {
  readonly httpStatus: number;

  constructor(message: string, httpStatus: number) {
    super(message);
    this.name = "DataCampConnectionError";
    this.httpStatus = httpStatus;
  }
}

export type DataCampFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

function resolveApiKey(apiKey = process.env.DATACAMP_API_KEY): string {
  const value = apiKey?.trim();
  if (!value) {
    throw new DataCampConnectionError(
      "DataCamp API key is not configured on the server.",
      503,
    );
  }
  return value;
}

export function toDataCampIntegrationToolRequest(
  request: DataCampRequest,
): IntegrationToolRequest {
  return {
    providerId: DATACAMP_PROVIDER_ID,
    tool: request.operation,
    input: request.input ?? {},
  };
}

export async function verifyDataCampConnection({
  apiKey = process.env.DATACAMP_API_KEY,
  baseUrl = process.env.DATACAMP_CATALOG_API_BASE_URL ?? DATACAMP_CATALOG_API_BASE_URL,
  fetchImpl = fetch,
}: {
  readonly apiKey?: string;
  readonly baseUrl?: string;
  readonly fetchImpl?: DataCampFetch;
} = {}): Promise<DataCampConnectionVerification> {
  const token = resolveApiKey(apiKey);
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const endpoint = normalizedBaseUrl + "/v1/catalog/live-courses";

  let response: Response;
  try {
    response = await fetchImpl(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + token,
      },
      cache: "no-store",
    });
  } catch {
    throw new DataCampConnectionError(
      "DataCamp could not be reached from the server.",
      502,
    );
  }

  if (!response.ok) {
    throw new DataCampConnectionError(
      "DataCamp catalog verification failed with HTTP " + response.status + ".",
      response.status,
    );
  }

  try {
    await response.json();
  } catch {
    throw new DataCampConnectionError(
      "DataCamp returned a response that was not valid JSON.",
      502,
    );
  }

  return {
    providerId: DATACAMP_PROVIDER_ID,
    pluginName: DATACAMP_PLUGIN_NAME,
    status: "connected",
    endpoint,
    verifiedAt: new Date().toISOString(),
  };
}

export interface DataCampGateway
  extends Pick<ExternalIntegrationGateway, "execute"> {
  execute(
    subjectId: string,
    request: IntegrationToolRequest,
  ): Promise<IntegrationToolResult>;
}
