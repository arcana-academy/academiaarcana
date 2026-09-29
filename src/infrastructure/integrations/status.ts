import { CHATGPT_APP_BRIDGES } from "./chatgpt-app-bridges";
import { getOpenAIAgentsRuntimeSnapshot } from "./openai-agents";
import { CHATGPT_PLUGIN_CATALOG } from "./chatgpt-plugin-catalog";
import {
  AGENTIC_COURSE_REDESIGN_APP_ID,
  AGENTIC_COURSE_REDESIGN_CAPABILITIES,
} from "./agentic-course-redesign";
import {
  verifyDataCampConnection,
  type DataCampConnectionVerification,
} from "./datacamp";
import {
  verifyDropboxConnection,
  type DropboxConnectionVerification,
} from "./dropbox";
import {
  verifyGitHubConnection,
  type GitHubConnectionVerification,
} from "./github/public-github";

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

export type IntegrationCatalogStatus = "catalogued" | "connected" | "error";
export type IntegrationExecutionMode =
  | "runtime"
  | "chatgpt-hosted"
  | "catalog-only";

export type IntegrationStatusEntry = {
  readonly name: string;
  readonly source: "chatgpt-catalog" | "runtime";
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
    | {
        readonly providerId: "datacamp";
        readonly endpoint: string;
        readonly verifiedAt: string;
      }
    | {
        readonly providerId: "dropbox";
        readonly accountId: string;
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

function dataCampVerificationEntry(
  verification: DataCampConnectionVerification,
): IntegrationStatusEntry {
  return {
    name: "DataCamp",
    source: "chatgpt-catalog",
    status: "connected",
    executionMode: "runtime",
    providerId: verification.providerId,
    capabilities: ["read", "search", "analytics"],
    verification: {
      providerId: verification.providerId,
      endpoint: verification.endpoint,
      verifiedAt: verification.verifiedAt,
    },
  };
}

function dataCampErrorEntry(): IntegrationStatusEntry {
  return {
    name: "DataCamp",
    source: "chatgpt-catalog",
    status: "error",
    executionMode: "runtime",
    providerId: "datacamp",
    capabilities: ["read", "search", "analytics"],
    verification: null,
  };
}

function dataCampCatalogEntry(): IntegrationStatusEntry {
  return {
    name: "DataCamp",
    source: "chatgpt-catalog",
    status: "catalogued",
    executionMode: "catalog-only",
    providerId: "datacamp",
    capabilities: ["read", "search", "analytics"],
    verification: null,
  };
}

function dropboxVerificationEntry(
  verification: DropboxConnectionVerification,
): IntegrationStatusEntry {
  return {
    name: "Dropbox",
    source: "chatgpt-catalog",
    status: "connected",
    executionMode: "runtime",
    providerId: verification.providerId,
    capabilities: ["read", "search", "files"],
    verification: {
      providerId: verification.providerId,
      accountId: verification.accountId,
      verifiedAt: verification.verifiedAt,
    },
  };
}

function dropboxCatalogEntry(): IntegrationStatusEntry {
  return {
    name: "Dropbox",
    source: "chatgpt-catalog",
    status: "catalogued",
    executionMode: "catalog-only",
    providerId: "dropbox",
    capabilities: ["read", "search", "files"],
    verification: null,
  };
}

function airtableVerificationEntry(verification: AirtableConnectionVerification): IntegrationStatusEntry {\n  return { name: "Airtable", source: "runtime", status: "connected", executionMode: "runtime", providerId: verification.providerId, capabilities: ["read", "write", "search", "metadata", "analytics"], verification: { providerId: verification.providerId, baseId: verification.baseId, tableCount: verification.tableCount, verifiedAt: verification.verifiedAt } };\n}\n\nfunction airtableCatalogEntry(): IntegrationStatusEntry {\n  return { name: "Airtable", source: "runtime", status: "catalogued", executionMode: "runtime", providerId: "airtable", capabilities: ["read", "write", "search", "metadata", "analytics"], verification: null };\n}\n\nfunction airtableErrorEntry(): IntegrationStatusEntry {\n  return { name: "Airtable", source: "runtime", status: "error", executionMode: "runtime", providerId: "airtable", capabilities: ["read", "write", "search", "metadata", "analytics"], verification: null };\n}\n\nfunction dropboxErrorEntry(): IntegrationStatusEntry {
  return {
    name: "Dropbox",
    source: "chatgpt-catalog",
    status: "error",
    executionMode: "runtime",
    providerId: "dropbox",
    capabilities: ["read", "search", "files"],
    verification: null,
  };
}

function chatgptBridgeUrl(pluginName: string): string | undefined {
  return Object.values(CHATGPT_APP_BRIDGES).find(
    (bridge) => bridge.displayName === pluginName,
  )?.appUrl;
}

export async function getIntegrationStatusSnapshot({
  githubVerifier = verifyGitHubConnection,
  dataCampVerifier = verifyDataCampConnection,
  dropboxVerifier = verifyDropboxConnection,
  dataCampApiKey = process.env.DATACAMP_API_KEY,
  dropboxToken = process.env.DROPBOX_RUNTIME_TOKEN,
}: {
  readonly githubVerifier?: () => Promise<GitHubConnectionVerification>;
  readonly dataCampVerifier?: () => Promise<DataCampConnectionVerification>;
  readonly dropboxVerifier?: (
    token?: string,
  ) => Promise<DropboxConnectionVerification>;
  readonly dataCampApiKey?: string;
  readonly dropboxToken?: string;
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
    // Keep the public status response generic.
  }

  let dataCampEntry = dataCampCatalogEntry();
  if (dataCampApiKey?.trim()) {
    try {
      dataCampEntry = dataCampVerificationEntry(await dataCampVerifier());
    } catch {
      dataCampEntry = dataCampErrorEntry();
    }
  }

  let dropboxEntry = dropboxCatalogEntry();
  if (dropboxToken?.trim()) {
    try {
      dropboxEntry = dropboxVerificationEntry(await dropboxVerifier(dropboxToken));
    } catch {
      dropboxEntry = dropboxErrorEntry();
    }
  }

  let airtableEntry = airtableCatalogEntry();\n  if (airtableToken?.trim() && airtableBaseId?.trim()) {\n    try { airtableEntry = airtableVerificationEntry(await airtableVerifier()); } catch { airtableEntry = airtableErrorEntry(); }\n  }\n\n  const entries = CHATGPT_PLUGIN_CATALOG.map((plugin) => {
    if (plugin.name === "GitHub") return githubEntry;
    if (plugin.name === "DataCamp") return dataCampEntry;
    if (plugin.name === "Dropbox") return dropboxEntry;\n    if (plugin.name === "Airtable") return airtableEntry;
    if (plugin.name === "Microsoft SharePoint") {
      return {
        name: "Microsoft SharePoint",
        source: "runtime" as const,
        status: "catalogued" as const,
        executionMode: "runtime" as const,
        providerId: "microsoft-sharepoint",
        capabilities: ["read", "search", "files", "versions", "metadata"],
        verification: null,
      };
    }

    const bridgeUrl = chatgptBridgeUrl(plugin.name);
    const isAgenticCourseRedesign = plugin.name === "Agentic Course Redesign";
    const isTarteel = plugin.name === "Tarteel";

    return {
      name: plugin.name,
      source: plugin.source,
      status: "catalogued" as const,
      executionMode:
        isAgenticCourseRedesign || isTarteel
          ? ("chatgpt-hosted" as const)
          : plugin.name === "Todoist"
            ? ("runtime" as const)
            : ("catalog-only" as const),
      ...(bridgeUrl ? { chatgptAppUrl: bridgeUrl } : {}),
      ...(plugin.name === "Todoist"
        ? {
            providerId: "todoist",
            capabilities: ["read", "write", "search", "calendar"],
          }
        : {}),
      ...(isAgenticCourseRedesign
        ? {
            capabilities: AGENTIC_COURSE_REDESIGN_CAPABILITIES,
            providerId: AGENTIC_COURSE_REDESIGN_APP_ID,
          }
        : {}),
      ...(isTarteel
        ? { capabilities: TARTEEL_CAPABILITIES, providerId: TARTEEL_APP_ID }
        : {}),
      verification: null,
    };
  });

  const runtimeIntegrations = [await getOpenAIAgentsRuntimeSnapshot()];

  return {
    generatedAt: new Date().toISOString(),
    catalogSize: entries.length,
    connectedCount: entries.filter((entry) => entry.status === "connected").length,
    cataloguedCount: entries.filter((entry) => entry.status === "catalogued").length,
    errorCount: entries.filter((entry) => entry.status === "error").length,
    entries,
    runtimeIntegrations,
  };
}
