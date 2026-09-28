import { CHATGPT_APP_BRIDGES, ONE_BILLION_BRAIN_CELLS_APP_ID } from "./chatgpt-app-bridges";
import { CHATGPT_PLUGIN_CATALOG } from "./chatgpt-plugin-catalog";
import {
  verifyGitHubConnection,
  type GitHubConnectionVerification,
} from "./github/public-github";

export type IntegrationCatalogStatus = "catalogued" | "connected" | "error";

export type IntegrationStatusEntry = {
  readonly name: string;
  readonly source: "chatgpt-catalog";
  readonly status: IntegrationCatalogStatus;
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
};

function githubVerificationEntry(
  verification: GitHubConnectionVerification,
): IntegrationStatusEntry {
  return {
    name: "GitHub",
    source: "chatgpt-catalog",
    status: "connected",
    verification: {
      providerId: verification.providerId,
      repository: verification.repository.fullName,
      verifiedAt: verification.verifiedAt,
    },
  };
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
    verification: null,
  };

  try {
    githubEntry = githubVerificationEntry(await githubVerifier());
  } catch {
    // Keep the public status response generic. Provider failures must not leak
    // network, authentication, or infrastructure details.
  }

  const entries = CHATGPT_PLUGIN_CATALOG.map((plugin) =>
    plugin.name === "GitHub"
      ? githubEntry
      : {
          name: plugin.name,
          source: plugin.source,
          status: "catalogued" as const,
          verification: null,
        },
  );

  return {
    generatedAt: new Date().toISOString(),
    catalogSize: entries.length,
    connectedCount: entries.filter((entry) => entry.status === "connected")
      .length,
    cataloguedCount: entries.filter((entry) => entry.status === "catalogued")
      .length,
    errorCount: entries.filter((entry) => entry.status === "error").length,
    entries,
  };
}

