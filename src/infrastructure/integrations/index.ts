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

export {
  AGENTIC_COURSE_REDESIGN_APP_ID,
  AGENTIC_COURSE_REDESIGN_PLUGIN_NAME,
  AGENTIC_COURSE_REDESIGN_EXECUTION_MODE,
  AGENTIC_COURSE_REDESIGN_CAPABILITIES,
  AGENTIC_COURSE_REDESIGN_INTEGRATION,
} from "./agentic-course-redesign";
export type {
  AgenticCourseRedesignCapability,
  AgenticCourseRedesignIntegration,
} from "./agentic-course-redesign";

export { CHATGPT_PLUGIN_CATALOG } from "./chatgpt-plugin-catalog";
export type { ChatGPTPluginCatalogEntry } from "./chatgpt-plugin-catalog";

export {
  A_Z_DAILY_WORD_APP_ID,
  A_Z_DAILY_WORD_CHATGPT_APP_URL,
  A_Z_DICTIONARY_APP_ID,
  A_Z_DICTIONARY_CHATGPT_APP_URL,
  A_Z_HOLY_BIBLE_APP_ID,
  A_Z_HOLY_BIBLE_CHATGPT_APP_URL,
  ACADEMIC_WRITING_TOOLKIT_APP_ID,
  ACADEMIC_WRITING_TOOLKIT_CHATGPT_APP_URL,
  ASTROLOGIC_APP_ID,
  ASTROLOGIC_CHATGPT_APP_URL,
  CHATGPT_APP_BRIDGES,
  ONE_BILLION_BRAIN_CELLS_APP_ID,
  ONE_BILLION_BRAIN_CELLS_CHATGPT_APP_URL,
  QUIZLET_APP_ID,
  QUIZLET_CHATGPT_APP_URL,
  SPOTIFY_APP_ID,
  TARTEEL_APP_ID,
  TARTEEL_CHATGPT_APP_URL,
  SPOTIFY_CHATGPT_APP_URL,
  TRUE_SKY_APP_ID,
  TRUE_SKY_CHATGPT_APP_URL,
} from "./chatgpt-app-bridges";
export type { ChatGPTAppBridge } from "./chatgpt-app-bridges";

export {
  TRUE_SKY_INTEGRATION_DEFINITION,
  TRUE_SKY_OPERATIONS,
  TRUE_SKY_PLUGIN_NAME,
  TRUE_SKY_PROVIDER_ID,
  toTrueSkyIntegrationToolRequest,
} from "./true-sky";
export type { TrueSkyGateway, TrueSkyOperation, TrueSkyRequest } from "./true-sky";

export {
  DEFAULT_GITHUB_VERIFICATION_REPOSITORY,
  GITHUB_INTEGRATION_DEFINITION,
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

export {
  OPENAI_AGENTS_INTEGRATION_DEFINITION,
  OPENAI_AGENTS_PROVIDER_ID,
  getOpenAIAgentsRuntimeSnapshot,
} from "./openai-agents";
export type { OpenAIAgentsRuntimeSnapshot, OpenAIAgentsRuntimeStatus } from "./openai-agents";

export {
  DATACAMP_CATALOG_API_BASE_URL,
  DATACAMP_INTEGRATION_DEFINITION,
  DATACAMP_OPERATIONS,
  DATACAMP_PLUGIN_NAME,
  DATACAMP_PROVIDER_ID,
  DataCampConnectionError,
  toDataCampIntegrationToolRequest,
  verifyDataCampConnection,
} from "./datacamp";
export type {
  DataCampConnectionVerification,
  DataCampFetch,
  DataCampGateway,
  DataCampOperation,
  DataCampRequest,
} from "./datacamp";

export {
  DROPBOX_API_BASE_URL,
  DROPBOX_INTEGRATION_DEFINITION,
  DROPBOX_PLUGIN_NAME,
  DROPBOX_PROVIDER_ID,
  DropboxConnectionError,
  executeDropboxRequest,
  listDropboxFolder,
  searchDropbox,
  verifyDropboxConnection,
} from "./dropbox";

export { getIntegrationStatusSnapshot } from "./status";
export type {
  IntegrationCatalogStatus,
  IntegrationExecutionMode,
  IntegrationStatusEntry,
  IntegrationStatusSnapshot,
} from "./status";
