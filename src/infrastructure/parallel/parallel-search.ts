const PARALLEL_API_ORIGIN = "https://api.parallel.ai";
const DEFAULT_TIMEOUT_MS = 12_000;
const MAX_SEARCH_QUERIES = 3;
const MAX_SEARCH_RESULTS = 8;
const MAX_EXTRACT_URLS = 5;
const MAX_URL_LENGTH = 2_048;

type ParallelApiWarning = {
  readonly type?: string;
  readonly message?: string;
};

type ParallelUsageItem = {
  readonly name?: string;
  readonly count?: number;
};

type ParallelSearchApiResult = {
  readonly url: string;
  readonly title?: string | null;
  readonly publish_date?: string | null;
  readonly excerpts?: readonly string[];
};

type ParallelSearchApiResponse = {
  readonly results?: readonly ParallelSearchApiResult[];
  readonly warnings?: readonly ParallelApiWarning[] | null;
  readonly usage?: readonly ParallelUsageItem[] | null;
  readonly session_id?: string;
};

type ParallelExtractApiResult = ParallelSearchApiResult & {
  readonly full_content?: string | null;
};

type ParallelExtractApiResponse = {
  readonly results?: readonly ParallelExtractApiResult[];
  readonly errors?: readonly {
    readonly url?: string;
    readonly error_type?: string;
    readonly http_status_code?: number | null;
  }[];
  readonly warnings?: readonly ParallelApiWarning[] | null;
  readonly usage?: readonly ParallelUsageItem[] | null;
  readonly session_id?: string;
};

export type ParallelSearchFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type ParallelSearchSource = {
  readonly url: string;
  readonly title: string | null;
  readonly publishDate: string | null;
  readonly excerpts: readonly string[];
};

export type ParallelSearchResult = {
  readonly sources: readonly ParallelSearchSource[];
  readonly sessionId: string | null;
};

export type ParallelExtractResult = {
  readonly sources: readonly {
    readonly url: string;
    readonly title: string | null;
    readonly publishDate: string | null;
    readonly excerpts: readonly string[];
    readonly fullContent: string | null;
  }[];
  readonly errors: readonly {
    readonly url: string;
    readonly type: string | null;
    readonly status: number | null;
  }[];
  readonly sessionId: string | null;
};

/** Returns the server-side Parallel API key, when configured. */
function getApiKey(): string | null {
  const value = process.env.PARALLEL_API_KEY?.trim();
  return value ? value : null;
}

/** Normalizes the configured Parallel API origin. */
function normalizeBaseUrl(): string {
  return (process.env.PARALLEL_API_BASE_URL?.trim() || PARALLEL_API_ORIGIN).replace(/\/$/, "");
}

/** Creates an abort signal for bounded provider requests. */
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  controller.signal.addEventListener("abort", () => clearTimeout(timer), { once: true });
  return controller.signal;
}

/** Fails closed when the Parallel integration has no API key. */
function assertConfigured(): string {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Parallel Search integration is not configured.");
  }
  return apiKey;
}

/** Trims, removes empty queries and applies the query-count limit. */
function normalizeQueries(queries: readonly string[]): string[] {
  return queries
    .map((query) => query.trim())
    .filter(Boolean)
    .slice(0, MAX_SEARCH_QUERIES);
}

/** Validates and normalizes an extraction URL. */
function validateUrl(value: string): string {
  const url = value.trim();
  if (url.length > MAX_URL_LENGTH) throw new Error("A URL excede o limite permitido.");
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("A URL informada é inválida.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Apenas URLs HTTP(S) são permitidas.");
  }
  return parsed.toString();
}

/** Executes one authenticated Parallel API request. */
async function parallelRequest(
  path: string,
  body: Record<string, unknown>,
  fetchImpl: ParallelSearchFetch,
): Promise<Response> {
  const apiKey = assertConfigured();
  try {
    return await fetchImpl(`${normalizeBaseUrl()}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: createTimeoutSignal(DEFAULT_TIMEOUT_MS),
    });
  } catch {
    throw new Error("Parallel Search não pôde ser alcançado pelo servidor.");
  }
}

/** Converts a failed Parallel response into a bounded error. */
async function parseError(response: Response): Promise<never> {
  let detail = "";
  try {
    const payload = (await response.json()) as {
      readonly error?: { readonly message?: unknown };
      readonly message?: unknown;
    };
    const candidate = payload.error?.message ?? payload.message;
    if (typeof candidate === "string") detail = candidate.slice(0, 180);
  } catch {
    // Keep provider error details out of the public response when the body is unknown.
  }
  throw new Error(
    detail
      ? `Parallel Search falhou (HTTP ${response.status}): ${detail}`
      : `Parallel Search falhou (HTTP ${response.status}).`,
  );
}

/** Maps a Parallel search result into the application source shape. */

function mapSource(result: ParallelSearchApiResult): ParallelSearchSource {
  return {
    url: result.url,
    title: result.title ?? null,
    publishDate: result.publish_date ?? null,
    excerpts: (result.excerpts ?? []).filter(
      (excerpt): excerpt is string => typeof excerpt === "string" && Boolean(excerpt.trim()),
    ),
  };
}

/** Maps one Parallel extraction result into the application source shape. */
function mapExtractSource(result: ParallelExtractApiResult): ParallelExtractResult["sources"][number] {
  return {
    ...mapSource(result),
    fullContent: result.full_content ?? null,
  };
}

/** Maps one Parallel extraction error into the application error shape. */
function mapExtractError(error: NonNullable<ParallelExtractApiResponse["errors"]>[number]): ParallelExtractResult["errors"][number] {
  return {
    url: typeof error.url === "string" ? error.url : "",
    type: error.error_type ?? null,
    status: error.http_status_code ?? null,
  };
}

/** Builds the bounded request body for Parallel extraction. */
function buildExtractBody(
  normalizedUrls: readonly string[],
  objective: string | undefined,
  queries: readonly string[],
): Record<string, unknown> {
  return {
    urls: normalizedUrls,
    ...(objective?.trim() ? { objective: objective.trim().slice(0, 1_000) } : {}),
    ...(queries.length > 0 ? { search_queries: queries } : {}),
  };
}

/** Validates search inputs and returns normalized request values. */
function validateSearchInputs(
  objective: string,
  searchQueries: readonly string[],
): { readonly objective: string; readonly queries: string[] } {
  const normalizedObjective = objective.trim();
  if (!normalizedObjective) {
    throw new Error("O objetivo da pesquisa é obrigatório.");
  }

  const queries = normalizeQueries(searchQueries);
  if (queries.length === 0) {
    throw new Error("Informe pelo menos uma consulta de pesquisa.");
  }

  return {
    objective: normalizedObjective,
    queries,
  };
}

/** Parses a successful JSON response from a Parallel endpoint. */
async function parseParallelPayload<T>(
  response: Response,
  errorMessage: string,
): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(errorMessage);
  }
}

/** Searches the web through Parallel and normalizes source metadata. */
export async function searchParallelWeb(
  {
    objective,
    searchQueries,
    fetchImpl = fetch,
  }: {
    readonly objective: string;
    readonly searchQueries: readonly string[];
    readonly fetchImpl?: ParallelSearchFetch;
  },
): Promise<ParallelSearchResult> {
  const { objective: normalizedObjective, queries } = validateSearchInputs(
    objective,
    searchQueries,
  );
  const response = await parallelRequest(
    "/v1/search",
    {
      objective: normalizedObjective.slice(0, 1_000),
      search_queries: queries,
      max_results: MAX_SEARCH_RESULTS,
    },
    fetchImpl,
  );

  if (!response.ok) await parseError(response);

  const payload = await parseParallelPayload<ParallelSearchApiResponse>(
    response,
    "Parallel Search retornou uma resposta inválida.",
  );

  return {
    sources: (payload.results ?? []).map(mapSource),
    sessionId: payload.session_id ?? null,
  };
}

/** Extracts content from public HTTP(S) URLs through Parallel. */

/** Extracts content from public HTTP(S) URLs through Parallel. */
export async function extractParallelWeb(
  {
    urls,
    objective,
    searchQueries = [],
    fetchImpl = fetch,
  }: {
    readonly urls: readonly string[];
    readonly objective?: string;
    readonly searchQueries?: readonly string[];
    readonly fetchImpl?: ParallelSearchFetch;
  },
): Promise<ParallelExtractResult> {
  const normalizedUrls = urls.map(validateUrl).slice(0, MAX_EXTRACT_URLS);
  if (normalizedUrls.length === 0) throw new Error("Informe pelo menos uma URL.");

  const queries = normalizeQueries(searchQueries);
  const response = await parallelRequest(
    "/v1/extract",
    buildExtractBody(normalizedUrls, objective, queries),
    fetchImpl,
  );

  if (!response.ok) await parseError(response);

  const payload = await parseParallelPayload<ParallelExtractApiResponse>(
    response,
    "Parallel Extract retornou uma resposta inválida.",
  );

  return {
    sources: (payload.results ?? []).map(mapExtractSource),
    errors: (payload.errors ?? []).map(mapExtractError),
    sessionId: payload.session_id ?? null,
  };
}
