import type { ExaSearchResult } from "./types";

const EXA_API_URL = "https://api.exa.ai/search";
const DEFAULT_NUM_RESULTS = 5;
const MAX_NUM_RESULTS = 10;

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

export type ExaFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

function getApiKey(): string | null {
  const value = process.env.EXA_API_KEY?.trim();
  return value ? value : null;
}

function normalizeResult(value: NonNullable<ExaApiResponse["results"]>[number]): ExaSearchResult | null {
  if (typeof value.title !== "string" || typeof value.url !== "string") return null;

  const highlights = Array.isArray(value.highlights)
    ? value.highlights.filter((item): item is string => typeof item === "string")
    : [];

  return {
    title: value.title,
    url: value.url,
    publishedDate: typeof value.publishedDate === "string" ? value.publishedDate : null,
    author: typeof value.author === "string" ? value.author : null,
    highlights,
  };
}

export async function searchWebWithExa(
  { query, numResults = DEFAULT_NUM_RESULTS }: ExaSearch,
  { fetchImpl = fetch }: { readonly fetchImpl?: ExaFetch } = {},
): Promise<readonly ExaSearchResult[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) throw new Error("A pesquisa web exige uma consulta.");

  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Exa integration is not configured.");

  const safeNumResults = Math.min(Math.max(Math.trunc(numResults), 1), MAX_NUM_RESULTS);

  let response: Response;
  try {
    response = await fetchImpl(EXA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query: normalizedQuery,
        type: "fast",
        numResults: safeNumResults,
        contents: { highlights: true },
      }),
      cache: "no-store",
    });
  } catch {
    throw new Error("Exa could not be reached from the server.");
  }

  if (!response.ok) throw new Error("Exa search failed with HTTP " + response.status + ".");

  let payload: ExaApiResponse;
  try {
    payload = (await response.json()) as ExaApiResponse;
  } catch {
    throw new Error("Exa returned an invalid JSON response.");
  }

  return (payload.results ?? []).map(normalizeResult).filter((result): result is ExaSearchResult => result !== null);
}