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
import {
  EXA_WEB_RESEARCH_INTEGRATION_DEFINITION,
} from "./exa-web-research";
import {
  PARALLEL_SEARCH_INTEGRATION_DEFINITION,
} from "./parallel-web-research";

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
};

/** Builds the verified GitHub integration status entry. */
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

/** Builds the verified DataCamp integration status entry. */
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

/** Builds the error state for an unavailable DataCamp integration. */
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

/** Builds the catalog-only state for an unconfigured DataCamp integration. */
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

/** Builds the verified Dropbox integration status entry. */
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

/** Builds the catalog-only state for an unconfigured Dropbox integration. */
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

/** Builds the error state for an unavailable Dropbox integration. */
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

/** Builds the verified Airtable integration status entry. */
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

/** Builds the catalog-only state for an unconfigured Airtable integration. */
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

/** Builds the error state for an unavailable Airtable integration. */
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

/** Builds a catalog entry for a server-side web-research provider. */
/** Builds the catalog-only status entry for a web-research provider. */
function webResearchCatalogEntry(
  definition:
    | typeof PARALLEL_SEARCH_INTEGRATION_DEFINITION
    | typeof EXA_WEB_RESEARCH_INTEGRATION_DEFINITION,
): IntegrationStatusEntry {
  return {
    name: definition.displayName,
    source: "runtime",
    status: "catalogued",
    executionMode: "runtime",
    providerId: definition.id,
    capabilities: definition.capabilities,
    verification: null,
  };
}

const chatgptBridgeUrls = new Map<string, string | undefined>(
  Object.values(CHATGPT_APP_BRIDGES).map((bridge) => [
    bridge.displayName,
    bridge.appUrl,
  ]),
);

/** Resolves GitHub status from a runtime verifier, failing closed on errors. */
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
}

/** Resolves DataCamp status from its optional server-side credential. */
const resolveDataCampEntry = async (
  verifier: () => Promise<DataCampConnectionVerification>,
  apiKey?: string,
): Promise<IntegrationStatusEntry> => {
  if (!apiKey?.trim()) return dataCampCatalogEntry();
  try {
    return dataCampVerificationEntry(await verifier());
  } catch {
    return dataCampErrorEntry();
  }
}

/** Resolves Dropbox status from its optional runtime token. */
const resolveDropboxEntry = async (
  verifier: (token?: string) => Promise<DropboxConnectionVerification>,
  token?: string,
): Promise<IntegrationStatusEntry> => {
  if (!token?.trim()) return dropboxCatalogEntry();
  try {
    return dropboxVerificationEntry(await verifier(token));
  } catch {
    return dropboxErrorEntry();
  }
}

/** Resolves Airtable status when both runtime credential inputs are available. */
const resolveAirtableEntry = async (
  verifier: () => Promise<AirtableConnectionVerification>,
  token?: string,
  baseId?: string,
): Promise<IntegrationStatusEntry> => {
  if (!token?.trim() || !baseId?.trim()) return airtableCatalogEntry();
  try {
    return airtableVerificationEntry(await verifier());
  } catch {
    return airtableErrorEntry();
  }
}

/** Builds a catalog-only runtime integration entry. */
const runtimeCatalogEntry = (
  name: string,
  providerId: string,
  capabilities: readonly string[],
): IntegrationStatusEntry => {
  return {
    name,
    source: "runtime",
    status: "catalogued",
    executionMode: "runtime",
    providerId,
    capabilities,
    verification: null,
  };
};

const STATIC_PLUGIN_ENTRIES = new Map<string, IntegrationStatusEntry>([
  [
    "Notion",
    runtimeCatalogEntry(
      "Notion",
      "notion",
      ["read", "write", "search", "metadata"],
    ),
  ],
  [
    "Outlook Calendar",
    runtimeCatalogEntry(
      "Outlook Calendar",
      "outlook-calendar",
      ["read", "write", "search", "calendar"],
    ),
  ],
  [
    "Asana",
    runtimeCatalogEntry(
      "Asana",
      ASANA_PROVIDER_ID,
      ["read", "write", "search"],
    ),
  ],
  [
    "Trello",
    runtimeCatalogEntry(
      "Trello",
      "trello",
      ["read", "write", "search", "metadata"],
    ),
  ],
  [
    "Todoist",
    runtimeCatalogEntry(
      "Todoist",
      "todoist",
      ["read", "write", "search", "calendar"],
    ),
  ],
  [
    "Agentic Course Redesign",
    {
      name: "Agentic Course Redesign",
      source: "chatgpt-catalog",
      status: "catalogued",
      executionMode: "chatgpt-hosted",
      providerId: AGENTIC_COURSE_REDESIGN_APP_ID,
      capabilities: AGENTIC_COURSE_REDESIGN_CAPABILITIES,
      verification: null,
    },
  ],
  [
    "Tarteel",
    {
      name: "Tarteel",
      source: "chatgpt-catalog",
      status: "catalogued",
      executionMode: "chatgpt-hosted",
      providerId: TARTEEL_APP_ID,
      capabilities: TARTEEL_CAPABILITIES,
      verification: null,
    },
  ],
]);

/** Builds the catalog representation for one ChatGPT plugin entry. */
const catalogEntryForPlugin = (
  plugin: (typeof CHATGPT_PLUGIN_CATALOG)[number],
): IntegrationStatusEntry => {
  const bridgeUrl = chatgptBridgeUrls.get(plugin.name);
  const staticEntry = STATIC_PLUGIN_ENTRIES.get(plugin.name);
  const baseEntry = staticEntry ?? {
    name: plugin.name,
    source: plugin.source,
    status: "catalogued" as const,
    executionMode: plugin.name === "Todoist" ? "runtime" as const : "catalog-only" as const,
    verification: null,
  };

  return {
    ...baseEntry,
    ...(bridgeUrl ? { chatgptAppUrl: bridgeUrl } : {}),
  };
};

/** Combines verified runtime entries with the canonical ChatGPT catalog. */
const buildIntegrationEntries = (
  githubEntry: IntegrationStatusEntry,
  dataCampEntry: IntegrationStatusEntry,
  dropboxEntry: IntegrationStatusEntry,
  airtableEntry: IntegrationStatusEntry,
): IntegrationStatusEntry[] => {
  const verifiedEntries = new Map<string, IntegrationStatusEntry>([
    ["GitHub", githubEntry],
    ["DataCamp", dataCampEntry],
    ["Dropbox", dropboxEntry],
    ["Airtable", airtableEntry],
  ]);
  return CHATGPT_PLUGIN_CATALOG.map(
    (plugin) => verifiedEntries.get(plugin.name) ?? catalogEntryForPlugin(plugin),
  );
};

/** Builds the final integration status snapshot from catalog entries. */
const buildIntegrationSnapshot = (
  entries: readonly IntegrationStatusEntry[],
  runtimeIntegrations: readonly Awaited<
    ReturnType<typeof getOpenAIAgentsRuntimeSnapshot>
  >[],
): IntegrationStatusSnapshot => {
  return {
    generatedAt: new Date().toISOString(),
    catalogSize: entries.length,
    connectedCount: entries.filter((entry) => entry.status === "connected").length,
    cataloguedCount: entries.filter((entry) => entry.status === "catalogued").length,
    errorCount: entries.filter((entry) => entry.status === "error").length,
    entries,
    runtimeIntegrations,
  };
};

/** Returns the current integration catalog and verified runtime connection states. */
export const getIntegrationStatusSnapshot = async ({
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
} = {}): Promise<IntegrationStatusSnapshot> => {
  const [githubEntry, dataCampEntry, dropboxEntry, airtableEntry] =
    await Promise.all([
      resolveGitHubEntry(githubVerifier),
      resolveDataCampEntry(dataCampVerifier, dataCampApiKey),
      resolveDropboxEntry(dropboxVerifier, dropboxToken),
      resolveAirtableEntry(airtableVerifier, airtableToken, airtableBaseId),
    ]);

  const entries = buildIntegrationEntries(
    githubEntry,
    dataCampEntry,
    dropboxEntry,
    airtableEntry,
  );
  const webResearchEntries = [
    webResearchCatalogEntry(PARALLEL_SEARCH_INTEGRATION_DEFINITION),
    webResearchCatalogEntry(EXA_WEB_RESEARCH_INTEGRATION_DEFINITION),
  ];
  const allEntries = [...entries, ...webResearchEntries];
  const runtimeIntegrations = [await getOpenAIAgentsRuntimeSnapshot()];

  return buildIntegrationSnapshot(allEntries, runtimeIntegrations);
}

