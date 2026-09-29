import { CHATGPT_APP_BRIDGES } from "./chatgpt-app-bridges";
import { getOpenAIAgentsRuntimeSnapshot } from "./openai-agents";
import { CHATGPT_PLUGIN_CATALOG } from "./chatgpt-plugin-catalog";
import {
  AGENTIC_COURSE_REDESIGN_APP_ID,
  AGENTIC_COURSE_REDESIGN_CAPABILITIES,
} from "./agentic-course-redesign";

const TARTEEL_APP_ID = "tarteel";
const TARTEEL_CAPABILITIES = [
  "ayah-search",
  "ayah-translation",
  "ayah-tafsir",
  "ayah-mutashabihat",
  "phrase-mutashabihat",
  "recitation",
  "prayer-times",
] as const;
import {
  verifyGitHubConnection,
  type GitHubConnectionVerification,
} from "./github/public-github";

export type IntegrationCatalogStatus = "catalogued" | "connected" | "error";
export type IntegrationExecutionMode =
  | "runtime"
  | "chatgpt-hosted"
  | "catalog-only";

export type IntegrationStatusEntry = {
  readonly name: string;
  readonly source: "chatgpt-catalog";
  readonly status: IntegrationCatalogStatus;
  readonly chatgptAppUrl?: string;
  readonly executionMode: IntegrationExecutionMode;
  readonly capabilities?: readonly string[];
  readonly providerId?: string;
  readonly verification:
    | {
        readonly providerId: "github";
        readonly repository: string;
        readonly verifiedAt: string;
      }
    | null;
};

export type IntegrationStatusSnapshot = {
  readonly generatedAt: string;
  readonly catalogSize: number;
  readonly connectedCount: number;
  readonly cataloguedCount: number;
  readonly errorCount: number;
  readonly entries: readonly IntegrationStatusEntry[];
  readonly runtimeIntegrations: readonly Awaited<
    ReturnType<typeof getOpenAIAgentsRuntimeSnapshot>
  >[];
};

function githubVerificationEntry(
  verification: GitHubConnectionVerification,
): IntegrationStatusEntry {
  return {
    name: "GitHub",
    source: "chatgpt-catalog",
    status: "connected",
    executionMode: "runtime",
    verification: {
      providerId: verification.providerId,
      repository: verification.repository.fullName,
      verifiedAt: verification.verifiedAt,
    },
  };
}

function chatgptBridgeUrl(pluginName: string): string | undefined {
  return Object.values(CHATGPT_APP_BRIDGES).find(
    (bridge) => bridge.displayName === pluginName,
  )?.appUrl;
}

export async function getIntegrationStatusSnapshot({
  githubVerifier = verifyGitHubConnection,
}: {
  readonly githubVerifier?: () => Promise<GitHubConnectionVerification>;
} = {}): Promise<IntegrationStatusSnapshot> {
  let githubEntry: IntegrationStatusEntry = {
    name: "GitHub",
    source: "chatgpt-catalog",
    status: "error",
    executionMode: "runtime",
    verification: null,
  };

  try {
    githubEntry = githubVerificationEntry(await githubVerifier());
  } catch {
    // Keep the public status response generic. Provider failures must not leak
    // network, authentication, or infrastructure details.
  }

  const entries = CHATGPT_PLUGIN_CATALOG.map((plugin) => {
    if (plugin.name === "GitHub") {
      return githubEntry;
    }

    const bridgeUrl = chatgptBridgeUrl(plugin.name);
    const isAgenticCourseRedesign =
      plugin.name === "Agentic Course Redesign";
    const isTarteel = plugin.name === "Tarteel";

    return {
      name: plugin.name,
      source: plugin.source,
      status: "catalogued" as const,
      executionMode:
        isAgenticCourseRedesign || isTarteel
          ? ("chatgpt-hosted" as const)
          : ("catalog-only" as const),
      ...(bridgeUrl ? { chatgptAppUrl: bridgeUrl } : {}),
      ...(isAgenticCourseRedesign
        ? {
            capabilities: AGENTIC_COURSE_REDESIGN_CAPABILITIES,
            providerId: AGENTIC_COURSE_REDESIGN_APP_ID,
          }
        : {}),
      ...(isTarteel
        ? {
            capabilities: TARTEEL_CAPABILITIES,
            providerId: TARTEEL_APP_ID,
          }
        : {}),
      verification: null,
    };
  });

  const runtimeIntegrations = [await getOpenAIAgentsRuntimeSnapshot()];

  return {
    generatedAt: new Date().toISOString(),
    catalogSize: entries.length,
    connectedCount: entries.filter((entry) => entry.status === "connected")
      .length,
    cataloguedCount: entries.filter((entry) => entry.status === "catalogued")
      .length,
    errorCount: entries.filter((entry) => entry.status === "error").length,
    entries,
    runtimeIntegrations,
  };
}
