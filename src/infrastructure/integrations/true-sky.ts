/**
 * True Sky integration boundary.
 *
 * True Sky exposes astrology calculations in the ChatGPT host. The web
 * runtime does not claim a direct vendor API unless a documented transport
 * and authorization contract has been verified. This module keeps the
 * application-facing contract stable for a future host/MCP bridge.
 */

import type {
  ExternalIntegrationGateway,
  IntegrationCapability,
  IntegrationDefinition,
  IntegrationToolRequest,
  IntegrationToolResult,
} from "./contracts";

export const TRUE_SKY_PROVIDER_ID = "true-sky" as const;
export const TRUE_SKY_PLUGIN_NAME = "True Sky" as const;

export const TRUE_SKY_INTEGRATION_DEFINITION = {
  id: TRUE_SKY_PROVIDER_ID,
  displayName: TRUE_SKY_PLUGIN_NAME,
  authMode: "mcp",
  capabilities: ["read", "ai"] satisfies readonly IntegrationCapability[],
  userConnectionRequired: false,
  serverSideOnly: true,
  scopes: [],
} satisfies IntegrationDefinition;

export const TRUE_SKY_OPERATIONS = [
  "get_natal_chart_data",
  "get_transit_data",
  "generate_horoscope",
  "generate_natal_chart_reading",
  "get_synastry_data",
  "get_composite_data",
  "get_return_data",
] as const;

export type TrueSkyOperation = (typeof TRUE_SKY_OPERATIONS)[number];

export type TrueSkyRequest = {
  readonly operation: TrueSkyOperation;
  readonly input: Record<string, unknown>;
};

export function toTrueSkyIntegrationToolRequest(
  request: TrueSkyRequest,
): IntegrationToolRequest {
  return {
    providerId: TRUE_SKY_PROVIDER_ID,
    tool: request.operation,
    input: request.input,
  };
}

export interface TrueSkyGateway
  extends Pick<ExternalIntegrationGateway, "execute"> {
  execute(
    subjectId: string,
    request: IntegrationToolRequest,
  ): Promise<IntegrationToolResult>;
}
