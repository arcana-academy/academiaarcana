export type {
  ExternalIntegrationGateway,
  IntegrationAuthMode,
  IntegrationCapability,
  IntegrationConnection,
  IntegrationConnectionStatus,
  IntegrationCredentialStore,
  IntegrationDefinition,
  IntegrationScopeVerifier,
  IntegrationToolRequest,
  IntegrationToolResult,
} from "./contracts";

export { CHATGPT_PLUGIN_CATALOG } from "./chatgpt-plugin-catalog";
export type { ChatGPTPluginCatalogEntry } from "./chatgpt-plugin-catalog";

export {
  DEFAULT_GITHUB_VERIFICATION_REPOSITORY,
  GITHUB_PLUGIN_NAME,
  GITHUB_PROVIDER_ID,
  GitHubConnectionError,
  verifyGitHubConnection,
} from "./github/public-github";
export type {
  GitHubConnectionVerification,
  GitHubFetch,
  GitHubRepositorySnapshot,
} from "./github/public-github";
