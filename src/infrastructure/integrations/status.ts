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
import {
  verifyAirtableConnection,
  type AirtableConnectionVerification,
} from "./airtable";
import { ASANA_PROVIDER_ID } from "./asana";
import { EXA_WEB_RESEARCH_INTEGRATION_DEFINITION } from "./exa-web-research";
import { PARALLEL_SEARCH_INTEGRATION_DEFINITION } from "./parallel-web-research";

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
export type IntegrationConfigurationStatus = "configured" | "not-configured";
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
  readonly configuration?: IntegrationConfigurationStatus;
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
    | {
        readonly providerId: "airtable";
        readonly baseId: string;
        readonly tableCount: number;
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
  readonly serverRuntimeIntegrations: readonly IntegrationStatusEntry[];
};

/** Maps a verified GitHub repository into the public integration status shape. */
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

function dropboxErrorEntry(): IntegrationStatusEntry {
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

function airtableVerificationEntry(
  verification: AirtableConnectionVerification,
): IntegrationStatusEntry {
  return {
    name: "Airtable",
    source: "runtime",
    status: "connected",
    executionMode: "runtime",
    providerId: verification.providerId,
    capabilities: ["read", "write", "search", "metadata", "analytics"],
    verification: {
      providerId: verification.providerId,
      baseId: verification.baseId,
      tableCount: verification.tableCount,
      verifiedAt: verification.verifiedAt,
    },
  };
}

function airtableCatalogEntry(): IntegrationStatusEntry {
  return {
    name: "Airtable",
    source: "runtime",
    status: "catalogued",
    executionMode: "runtime",
    providerId: "airtable",
    capabilities: ["read", "write", "search", "metadata", "analytics"],
    verification: null,
  };
}

function airtableErrorEntry(): IntegrationStatusEntry {
  return {
    name: "Airtable",
    source: "runtime",
    status: "error",
    executionMode: "runtime",
    providerId: "airtable",
    capabilities: ["read", "write", "search", "metadata", "analytics"],
    verification: null,
  };
}

/** Creates a non-sensitive status entry for a server-side provider. */
function serverRuntimeEntry(
  definition: {
    readonly id: string;
    readonly displayName: string;
    readonly capabilities: readonly string[];
  },
  credential: string | undefined,
): IntegrationStatusEntry {
  return {
    name: definition.displayName,
    source: "runtime",
    status: "catalogued",
    executionMode: "runtime",
    providerId: definition.id,
    capabilities: definition.capabilities,
    configuration: credential?.trim() ? "configured" : "not-configured",
    verification: null,
  };
}

/** Resolves the official ChatGPT launch URL for a catalog entry, when available. */
function chatgptBridgeUrl(pluginName: string): string | undefined {
  return Object.values(CHATGPT_APP_BRIDGES).find(
    (bridge) => bridge.displayName === pluginName,
  )?.appUrl;
}

const resolveGitHubEntry = async (
  verifier: () => Promise<GitHubConnectionVerification>,
): Promise<IntegrationStatusEntry> => {
  try {
    return githubVerificationEntry(await verifier());
  } catch {
    return {
      name: "GitHub",
      source: "chatgpt-catalog",
      status: "error",
      executionMode: "runtime",
      verification: null,
    };
  }
};

const resolveDataCampEntry = async (
  verifier: () => Promise<DataCampConnectionVerification>,
  apiKey: string | undefined,
): Promise<IntegrationStatusEntry> => {
  if (!apiKey?.trim()) return dataCampCatalogEntry();
  try {
    return dataCampVerificationEntry(await verifier());
  } catch {
    return dataCampErrorEntry();
  }
};

const resolveDropboxEntry = async (
  verifier: (token?: string) => Promise<DropboxConnectionVerification>,
  token: string | undefined,
): Promise<IntegrationStatusEntry> => {
  if (!token?.trim()) return dropboxCatalogEntry();
  try {
    return dropboxVerificationEntry(await verifier(token));
  } catch {
    return dropboxErrorEntry();
  }
};

const resolveAirtableEntry = async (
  verifier: () => Promise<AirtableConnectionVerification>,
  token: string | undefined,
  baseId: string | undefined,
): Promise<IntegrationStatusEntry> => {
  if (!token?.trim() || !baseId?.trim()) return airtableCatalogEntry();
  try {
    return airtableVerificationEntry(await verifier());
  } catch {
    return airtableErrorEntry();
  }
};

const resolveVerifiedEntries = async ({
  githubVerifier,
  dataCampVerifier,
  dataCampApiKey,
  dropboxVerifier,
  dropboxToken,
  airtableVerifier,
  airtableToken,
  airtableBaseId,
}: {
  readonly githubVerifier: () => Promise<GitHubConnectionVerification>;
  readonly dataCampVerifier: () => Promise<DataCampConnectionVerification>;
  readonly dataCampApiKey?: string;
  readonly dropboxVerifier: (token?: string) => Promise<DropboxConnectionVerification>;
  readonly dropboxToken?: string;
  readonly airtableVerifier: () => Promise<AirtableConnectionVerification>;
  readonly airtableToken?: string;
  readonly airtableBaseId?: string;
}): Promise<{
  readonly githubEntry: IntegrationStatusEntry;
  readonly dataCampEntry: IntegrationStatusEntry;
  readonly dropboxEntry: IntegrationStatusEntry;
  readonly airtableEntry: IntegrationStatusEntry;
  readonly runtimeIntegration: Awaited<
    ReturnType<typeof getOpenAIAgentsRuntimeSnapshot>
  >;
}> => {
  const [
    githubEntry,
    dataCampEntry,
    dropboxEntry,
    airtableEntry,
    runtimeIntegration,
  ] = await Promise.all([
    resolveGitHubEntry(githubVerifier),
    resolveDataCampEntry(dataCampVerifier, dataCampApiKey),
    resolveDropboxEntry(dropboxVerifier, dropboxToken),
    resolveAirtableEntry(airtableVerifier, airtableToken, airtableBaseId),
    getOpenAIAgentsRuntimeSnapshot(),
  ]);

  return {
    githubEntry,
    dataCampEntry,
    dropboxEntry,
    airtableEntry,
    runtimeIntegration,
  };
};

const buildCatalogEntries = ({
  githubEntry,
  dataCampEntry,
  dropboxEntry,
  airtableEntry,
}: {
  readonly githubEntry: IntegrationStatusEntry;
  readonly dataCampEntry: IntegrationStatusEntry;
  readonly dropboxEntry: IntegrationStatusEntry;
  readonly airtableEntry: IntegrationStatusEntry;
}): IntegrationStatusEntry[] =>
  CHATGPT_PLUGIN_CATALOG.map((plugin) => {
    if (plugin.name === "GitHub") return githubEntry;
    if (plugin.name === "DataCamp") return dataCampEntry;
    if (plugin.name === "Dropbox") return dropboxEntry;
    if (plugin.name === "Notion") {
      return {
        name: "Notion",
        source: "runtime" as const,
        status: "catalogued" as const,
        executionMode: "runtime" as const,
        providerId: "notion",
        capabilities: ["read", "write", "search", "metadata"],
        verification: null,
      };
    }
    if (plugin.name === "Outlook Calendar") {
      return {
        name: "Outlook Calendar",
        source: "runtime" as const,
        status: "catalogued" as const,
        executionMode: "runtime" as const,
        providerId: "outlook-calendar",
        capabilities: ["read", "write", "search", "calendar"],
        verification: null,
      };
    }
    if (plugin.name === "Airtable") return airtableEntry;
    if (plugin.name === "Asana") {
      return {
        name: "Asana",
        source: "runtime" as const,
        status: "catalogued" as const,
        executionMode: "runtime" as const,
        providerId: ASANA_PROVIDER_ID,
        capabilities: ["read", "write", "search"],
        verification: null,
      };
    }
    if (plugin.name === "Trello") {
      return {
        name: "Trello",
        source: "runtime" as const,
        status: "catalogued" as const,
        executionMode: "runtime" as const,
        providerId: "trello",
        capabilities: ["read", "write", "search", "metadata"],
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

export async function getIntegrationStatusSnapshot({
  githubVerifier = verifyGitHubConnection,
  dataCampVerifier = verifyDataCampConnection,
  dropboxVerifier = verifyDropboxConnection,
  dataCampApiKey = process.env.DATACAMP_API_KEY,
  dropboxToken = process.env.DROPBOX_RUNTIME_TOKEN,
  airtableVerifier = verifyAirtableConnection,
  airtableToken = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN,
  airtableBaseId = process.env.AIRTABLE_BASE_ID,
}: {
  readonly githubVerifier?: () => Promise<GitHubConnectionVerification>;
  readonly dataCampVerifier?: () => Promise<DataCampConnectionVerification>;
  readonly dropboxVerifier?: (
    token?: string,
  ) => Promise<DropboxConnectionVerification>;
  readonly airtableVerifier?: () => Promise<AirtableConnectionVerification>;
  readonly dataCampApiKey?: string;
  readonly dropboxToken?: string;
  readonly airtableToken?: string;
  readonly airtableBaseId?: string;
} = {}): Promise<IntegrationStatusSnapshot> {
  const {
    githubEntry,
    dataCampEntry,
    dropboxEntry,
    airtableEntry,
    runtimeIntegration,
  } = await resolveVerifiedEntries({
    githubVerifier,
    dataCampVerifier,
    dataCampApiKey,
    dropboxVerifier,
    dropboxToken,
    airtableVerifier,
    airtableToken,
    airtableBaseId,
  });

  const entries = buildCatalogEntries({
    githubEntry,
    dataCampEntry,
    dropboxEntry,
    airtableEntry,
  });

  const serverRuntimeIntegrations = [
    serverRuntimeEntry(
      PARALLEL_SEARCH_INTEGRATION_DEFINITION,
      process.env.PARALLEL_API_KEY,
    ),
    serverRuntimeEntry(
      EXA_WEB_RESEARCH_INTEGRATION_DEFINITION,
      process.env.EXA_API_KEY,
    ),
  ];
  const allEntries = [...entries, ...serverRuntimeIntegrations];

  return {
    generatedAt: new Date().toISOString(),
    catalogSize: allEntries.length,
    connectedCount: allEntries.filter((entry) => entry.status === "connected").length,
    cataloguedCount: allEntries.filter((entry) => entry.status === "catalogued").length,
    errorCount: allEntries.filter((entry) => entry.status === "error").length,
    entries: allEntries,
    runtimeIntegrations: [runtimeIntegration],
    serverRuntimeIntegrations,
  };
}
