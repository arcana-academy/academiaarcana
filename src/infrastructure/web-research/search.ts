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

/** Returns whether a value names a supported web-research provider. */
function isWebResearchProvider(value: string): value is WebResearchProvider {
  return value === "parallel" || value === "exa";
}

/** Ensures the explicitly selected provider has its server-side credential. */
function assertSelectedProviderConfigured(provider: WebResearchProvider): void {
  const keyName = provider === "parallel" ? "PARALLEL_API_KEY" : "EXA_API_KEY";
  if (!hasKey(keyName)) {
    throw new Error(
      `Configured web research provider "${provider}" is not configured.`,
    );
  }
}

/** Resolves an explicitly requested provider, or returns null when none was requested. */
function resolveConfiguredProvider(
  configured: string | undefined,
): WebResearchProvider | null {
  if (!configured) return null;
  if (!isWebResearchProvider(configured)) {
    throw new Error(
      "MESTRE_ARCANO_WEB_RESEARCH_PROVIDER must be either parallel or exa.",
    );
  }

  assertSelectedProviderConfigured(configured);
  return configured;
}



/** Returns the provider selected when exactly one server-side credential exists. */
function selectSingleConfiguredProvider(
  parallelConfigured: boolean,
  exaConfigured: boolean,
): WebResearchProvider {
  if (parallelConfigured === exaConfigured) {
    throw new Error(
      parallelConfigured
        ? "Both web research providers are configured. Set MESTRE_ARCANO_WEB_RESEARCH_PROVIDER explicitly."
        : "No web research provider is configured.",
    );
  }

  return parallelConfigured ? "parallel" : "exa";
}

/** Resolves a provider from the available server-side credentials. */
function resolveAutomaticProvider(): WebResearchProvider {
  return selectSingleConfiguredProvider(
    hasKey("PARALLEL_API_KEY"),
    hasKey("EXA_API_KEY"),
  );
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
