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

/** Builds the verified GitHub catalog entry. */
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


/** Builds a server-side runtime integration entry without claiming a verified connection. */
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

/** Resolves GitHub verification while keeping provider diagnostics private. */
async function resolveGitHubEntry(
  verifier: () => Promise<GitHubConnectionVerification>,
): Promise<IntegrationStatusEntry> {
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

/** Resolves DataCamp verification when its server-side key is available. */
async function resolveDataCampEntry(
  verifier: () => Promise<DataCampConnectionVerification>,
  apiKey: string | undefined,
): Promise<IntegrationStatusEntry> {
  if (!apiKey?.trim()) return dataCampCatalogEntry();
  try {
    return dataCampVerificationEntry(await verifier());
  } catch {
    return dataCampErrorEntry();
  }
}

/** Resolves Dropbox verification when its server-side token is available. */
async function resolveDropboxEntry(
  verifier: (token?: string) => Promise<DropboxConnectionVerification>,
  token: string | undefined,
): Promise<IntegrationStatusEntry> {
  if (!token?.trim()) return dropboxCatalogEntry();
  try {
    return dropboxVerificationEntry(await verifier(token));
  } catch {
    return dropboxErrorEntry();
  }
}

/** Resolves Airtable verification when its token and base are configured. */
async function resolveAirtableEntry(
  verifier: () => Promise<AirtableConnectionVerification>,
  token: string | undefined,
  baseId: string | undefined,
): Promise<IntegrationStatusEntry> {
  if (!token?.trim() || !baseId?.trim()) return airtableCatalogEntry();
  try {
    return airtableVerificationEntry(await verifier());
  } catch {
    return airtableErrorEntry();
  }
}

/** Returns the ChatGPT bridge URL for a catalog entry when available. */
function chatgptBridgeUrl(pluginName: string): string | undefined {
  return Object.values(CHATGPT_APP_BRIDGES).find(
    (bridge) => bridge.displayName === pluginName,
  )?.appUrl;
}

type CatalogOverrides = Readonly<Record<string, IntegrationStatusEntry>>;

type CatalogEntryMetadata = {
  readonly executionMode?: IntegrationExecutionMode;
  readonly providerId?: string;
  readonly capabilities?: readonly string[];
};

const SPECIAL_CATALOG_METADATA: Readonly<
  Record<string, CatalogEntryMetadata>
> = {
  Todoist: {
    executionMode: "runtime",
    providerId: "todoist",
    capabilities: ["read", "write", "search", "calendar"],
  },
  "Agentic Course Redesign": {
    executionMode: "chatgpt-hosted",
    providerId: AGENTIC_COURSE_REDESIGN_APP_ID,
    capabilities: AGENTIC_COURSE_REDESIGN_CAPABILITIES,
  },
  Tarteel: {
    executionMode: "chatgpt-hosted",
    providerId: TARTEEL_APP_ID,
    capabilities: TARTEEL_CAPABILITIES,
  },
};

/** Builds one catalog entry while keeping provider-specific behavior declarative. */
function buildCatalogEntry(
  plugin: (typeof CHATGPT_PLUGIN_CATALOG)[number],
  overrides: CatalogOverrides,
): IntegrationStatusEntry {
  return (
    overrides[plugin.name] ?? {
      name: plugin.name,
      source: plugin.source,
      status: "catalogued",
      executionMode:
        SPECIAL_CATALOG_METADATA[plugin.name]?.executionMode ??
        "catalog-only",
      ...(SPECIAL_CATALOG_METADATA[plugin.name]?.providerId
        ? { providerId: SPECIAL_CATALOG_METADATA[plugin.name]?.providerId }
        : {}),
      ...(SPECIAL_CATALOG_METADATA[plugin.name]?.capabilities
        ? { capabilities: SPECIAL_CATALOG_METADATA[plugin.name]?.capabilities }
        : {}),
      ...(chatgptBridgeUrl(plugin.name)
        ? { chatgptAppUrl: chatgptBridgeUrl(plugin.name) }
        : {}),
      verification: null,
    }
  );
}

/** Builds the verified/runtime overrides for catalogued integrations. */
function buildCatalogOverrides({
  githubEntry,
  dataCampEntry,
  dropboxEntry,
  airtableEntry,
}: {
  readonly githubEntry: IntegrationStatusEntry;
  readonly dataCampEntry: IntegrationStatusEntry;
  readonly dropboxEntry: IntegrationStatusEntry;
  readonly airtableEntry: IntegrationStatusEntry;
}): CatalogOverrides {
  return {
    GitHub: githubEntry,
    DataCamp: dataCampEntry,
    Dropbox: dropboxEntry,
    Airtable: airtableEntry,
    Notion: {
      name: "Notion",
      source: "runtime",
      status: "catalogued",
      executionMode: "runtime",
      providerId: "notion",
      capabilities: ["read", "write", "search", "metadata"],
      verification: null,
    },
    "Outlook Calendar": {
      name: "Outlook Calendar",
      source: "runtime",
      status: "catalogued",
      executionMode: "runtime",
      providerId: "outlook-calendar",
      capabilities: ["read", "write", "search", "calendar"],
      verification: null,
    },
    Asana: {
      name: "Asana",
      source: "runtime",
      status: "catalogued",
      executionMode: "runtime",
      providerId: ASANA_PROVIDER_ID,
      capabilities: ["read", "write", "search"],
      verification: null,
    },
    Trello: {
      name: "Trello",
      source: "runtime",
      status: "catalogued",
      executionMode: "runtime",
      providerId: "trello",
      capabilities: ["read", "write", "search", "metadata"],
      verification: null,
    },
  };
}

/** Returns the integration catalog and independently verified runtime state. */
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


  const overrides = buildCatalogOverrides({
    githubEntry,
    dataCampEntry,
    dropboxEntry,
    airtableEntry,
  });
  const entries = CHATGPT_PLUGIN_CATALOG.map((plugin) =>
    buildCatalogEntry(plugin, overrides),
  );

  const runtimeIntegrations = [runtimeIntegration];
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

  return {
    generatedAt: new Date().toISOString(),
    catalogSize: entries.length,
    connectedCount: entries.filter((entry) => entry.status === "connected").length,
    cataloguedCount: entries.filter((entry) => entry.status === "catalogued").length,
    errorCount: entries.filter((entry) => entry.status === "error").length,
    entries,
    runtimeIntegrations,
    serverRuntimeIntegrations,
  };
}
