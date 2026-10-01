import type { IntegrationDefinition } from "./contracts";

export const PARALLEL_SEARCH_PROVIDER_ID = "parallel-web-research" as const;

export const PARALLEL_SEARCH_INTEGRATION_DEFINITION = {
  id: PARALLEL_SEARCH_PROVIDER_ID,
  displayName: "Parallel — Web Research do Mestre Arcano",
  authMode: "api_key",
  capabilities: ["search"],
  userConnectionRequired: false,
  serverSideOnly: true,
  scopes: [],
  documentationUrl: "https://parallel.ai/docs",
} satisfies IntegrationDefinition;
