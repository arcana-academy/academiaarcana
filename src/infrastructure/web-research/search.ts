import {
  extractParallelWeb,
  searchParallelWeb,
} from "@/infrastructure/parallel/parallel-search";
import { searchWebWithExa } from "@/infrastructure/exa/search";

export type WebResearchProvider = "parallel" | "exa";

export type WebResearchFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type WebResearchSource = {
  readonly provider: WebResearchProvider;
  readonly url: string;
  readonly title: string | null;
  readonly publishedAt: string | null;
  readonly author: string | null;
  readonly excerpts: readonly string[];
};

export type WebResearchSearchResult = {
  readonly provider: WebResearchProvider;
  readonly sources: readonly WebResearchSource[];
  readonly sessionId: string | null;
};

export type WebResearchExtractionResult = {
  readonly provider: "parallel";
  readonly sources: readonly (WebResearchSource & {
    readonly fullContent: string | null;
  })[];
  readonly errors: readonly {
    readonly url: string;
    readonly type: string | null;
    readonly status: number | null;
  }[];
  readonly sessionId: string | null;
};

/** Returns whether the named web-research provider has a server-side API key. */
function hasKey(name: "PARALLEL_API_KEY" | "EXA_API_KEY"): boolean {
  return Boolean(process.env[name]?.trim());
}

/** Resolves an explicitly requested provider, or returns null when none was requested. */
function resolveConfiguredProvider(
  configured: string | undefined,
): WebResearchProvider | null {
  if (!configured) return null;

  if (configured !== "parallel" && configured !== "exa") {
    throw new Error(
      "MESTRE_ARCANO_WEB_RESEARCH_PROVIDER must be either parallel or exa.",
    );
  }

  const keyName =
    configured === "parallel" ? "PARALLEL_API_KEY" : "EXA_API_KEY";
  if (!hasKey(keyName)) {
    throw new Error(
      `Configured web research provider "${configured}" is not configured.`,
    );
  }

  return configured;
}

/** Resolves a provider from the available server-side credentials. */
function resolveAutomaticProvider(): WebResearchProvider {
  const parallelConfigured = hasKey("PARALLEL_API_KEY");
  const exaConfigured = hasKey("EXA_API_KEY");

  if (parallelConfigured === exaConfigured) {
    if (parallelConfigured) {
      throw new Error(
        "Both web research providers are configured. Set MESTRE_ARCANO_WEB_RESEARCH_PROVIDER explicitly.",
      );
    }
    throw new Error("No web research provider is configured.");
  }

  return parallelConfigured ? "parallel" : "exa";
}

/** Resolves the single configured or explicitly selected web-research provider. */
export function resolveWebResearchProvider(): WebResearchProvider {
  const configured = resolveConfiguredProvider(
    process.env.MESTRE_ARCANO_WEB_RESEARCH_PROVIDER?.trim().toLowerCase(),
  );

  return configured ?? resolveAutomaticProvider();
}

/** Searches the configured provider and normalizes sources for the Mestre Arcano. */
export async function searchWebResearch({
  objective,
  query,
  numResults = 5,
  fetchImpl,
}: {
  readonly objective: string;
  readonly query: string;
  readonly numResults?: number;
  readonly fetchImpl?: WebResearchFetch;
}): Promise<WebResearchSearchResult> {
  const provider = resolveWebResearchProvider();

  if (provider === "parallel") {
    const result = await searchParallelWeb({
      objective,
      searchQueries: [query],
      fetchImpl,
    });

    return {
      provider,
      sources: result.sources.map((source) => ({
        provider,
        url: source.url,
        title: source.title,
        publishedAt: source.publishDate,
        author: null,
        excerpts: source.excerpts,
      })),
      sessionId: result.sessionId,
    };
  }

  const sources = await searchWebWithExa(
    { query, numResults },
    { fetchImpl },
  );

  return {
    provider,
    sources: sources.map((source) => ({
      provider,
      url: source.url,
      title: source.title,
      publishedAt: source.publishedDate,
      author: source.author,
      excerpts: source.highlights,
    })),
    sessionId: null,
  };
}

/** Extracts sources through the Parallel-backed web research contract. */
export async function extractWebResearch({
  urls,
  objective,
  fetchImpl,
}: {
  readonly urls: readonly string[];
  readonly objective?: string;
  readonly fetchImpl?: WebResearchFetch;
}): Promise<WebResearchExtractionResult> {
  const provider = resolveWebResearchProvider();

  if (provider !== "parallel") {
    throw new Error(
      "Web extraction requires the Parallel web research provider.",
    );
  }

  const result = await extractParallelWeb({
    urls,
    objective,
    fetchImpl,
  });

  return {
    provider,
    sources: result.sources.map((source) => ({
      provider,
      url: source.url,
      title: source.title,
      publishedAt: source.publishDate,
      author: null,
      excerpts: source.excerpts,
      fullContent: source.fullContent,
    })),
    errors: result.errors,
    sessionId: result.sessionId,
  };
}
