import { getRuntimeSecret } from "@/infrastructure/runtime-secrets";

const EXA_API_URL = "https://api.exa.ai/search";
const DEFAULT_NUM_RESULTS = 5;
const MAX_NUM_RESULTS = 10;
const EXA_TIMEOUT_MS = 12_000;

export type ExaSearch = {
  readonly query: string;
  readonly numResults?: number;
};

export type ExaSearchResult = {
  readonly title: string;
  readonly url: string;
  readonly publishedDate: string | null;
  readonly author: string | null;
  readonly highlights: readonly string[];
};

type ExaApiResponse = {
  readonly results?: readonly {
    readonly title?: unknown;
    readonly url?: unknown;
    readonly publishedDate?: unknown;
    readonly author?: unknown;
    readonly highlights?: unknown;
  }[];
};

export type ExaFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

/** Returns the server-side Exa API key, when configured. */
function getApiKey(): string | null {
  return getRuntimeSecret("EXA_API_KEY");
}

/** Converts an unknown value into an optional string field. */
function getOptionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/** Normalizes the highlight array returned by Exa. */
function normalizeHighlights(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

/** Returns a required non-empty string field or null. */
function getRequiredString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.trim() ? value : null;
}

/** Normalizes one Exa result into the provider-neutral search shape. */
function normalizeResult(
  value: NonNullable<ExaApiResponse["results"]>[number],
): ExaSearchResult | null {
  const title = getRequiredString(value.title);
  const url = getRequiredString(value.url);

  if (!title || !url) return null;

  return {
    title,
    url,
    publishedDate: getOptionalString(value.publishedDate),
    author: getOptionalString(value.author),
    highlights: normalizeHighlights(value.highlights),
  };
}

/** Bounds the requested result count to the provider contract. */
function getSafeNumResults(numResults: number): number {
  return Math.min(Math.max(Math.trunc(numResults), 1), MAX_NUM_RESULTS);
}

/** Builds the JSON payload sent to the Exa search endpoint. */
function buildExaRequestBody(query: string, numResults: number): string {
  return JSON.stringify({
    query,
    type: "fast",
    numResults: getSafeNumResults(numResults),
    contents: { highlights: true },
  });
}

/** Performs the server-side request to Exa. */
async function requestExa(
  query: string,
  numResults: number,
  apiKey: string,
  fetchImpl: ExaFetch,
): Promise<Response> {
  try {
    return await fetchImpl(EXA_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: buildExaRequestBody(query, numResults),
      cache: "no-store",
      signal: AbortSignal.timeout(EXA_TIMEOUT_MS),
    });
  } catch {
    throw new Error("Exa could not be reached from the server.");
  }
}

/** Parses a successful Exa response body. */
async function readExaResponse(response: Response): Promise<ExaApiResponse> {
  try {
    return (await response.json()) as ExaApiResponse;
  } catch {
    throw new Error("Exa returned an invalid JSON response.");
  }
}

/** Normalizes and validates the Exa search query. */
function normalizeQuery(query: string): string {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) throw new Error("A pesquisa web exige uma consulta.");
  return normalizedQuery;
}

/** Fails closed when the Exa provider has no server-side API key. */
function assertConfigured(): string {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Exa integration is not configured.");
  return apiKey;
}

/** Ensures an Exa response is successful before its payload is parsed. */
function ensureSuccessfulResponse(response: Response): Response {
  if (!response.ok) {
    throw new Error(`Exa search failed with HTTP ${response.status}.`);
  }
  return response;
}

/** Executes the authenticated Exa search request and normalizes external evidence. */
async function executeExaSearch(
  query: string,
  numResults: number,
  fetchImpl: ExaFetch,
): Promise<readonly ExaSearchResult[]> {
  const response = await requestExa(
    query,
    numResults,
    assertConfigured(),
    fetchImpl,
  );
  const payload = await readExaResponse(ensureSuccessfulResponse(response));

  return (payload.results ?? [])
    .map(normalizeResult)
    .filter((result): result is ExaSearchResult => result !== null);
}

/** Searches Exa and returns normalized external evidence. */
export function searchWebWithExa(
  search: ExaSearch,
  options?: { readonly fetchImpl?: ExaFetch },
): Promise<readonly ExaSearchResult[]> {
  const query = normalizeQuery(search.query);
  const numResults = search.numResults ?? DEFAULT_NUM_RESULTS;
  const fetchImpl = options?.fetchImpl ?? fetch;

  return executeExaSearch(query, numResults, fetchImpl);
}
