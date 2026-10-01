import type { IntegrationDefinition } from "./contracts";

export const EXA_WEB_RESEARCH_PROVIDER_ID = "exa-web-research" as const;

export const EXA_WEB_RESEARCH_INTEGRATION_DEFINITION = {
  id: EXA_WEB_RESEARCH_PROVIDER_ID,
  displayName: "Exa — Web Research do Mestre Arcano",
  authMode: "api_key",
  capabilities: ["search"],
  userConnectionRequired: false,
  serverSideOnly: true,
  scopes: [],
  documentationUrl: "https://exa.ai/docs/reference/search",
} satisfies IntegrationDefinition;
