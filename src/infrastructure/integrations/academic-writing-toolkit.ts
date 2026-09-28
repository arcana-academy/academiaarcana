/**
 * Academic Writing Toolkit integration boundary.
 *
 * The Academic Writing Toolkit is available to the ChatGPT/MCP host, but the
 * Academia Arcana web runtime does not have a vendor HTTP API or credential
 * contract for invoking it directly. This module therefore exposes the exact
 * capability contract without pretending that the browser/server can call the
 * ChatGPT tool.
 *
 * A future runtime bridge may implement these operations behind
 * ExternalIntegrationGateway without changing the application-facing names.
 */

import type {
  ExternalIntegrationGateway,
  IntegrationCapability,
  IntegrationDefinition,
  IntegrationToolRequest,
  IntegrationToolResult,
} from "./contracts";

export const ACADEMIC_WRITING_TOOLKIT_PROVIDER_ID =
  "academic-writing-toolkit" as const;

export const ACADEMIC_WRITING_TOOLKIT_DEFINITION = {
  id: ACADEMIC_WRITING_TOOLKIT_PROVIDER_ID,
  displayName: "Academic Writing Toolkit",
  authMode: "mcp",
  capabilities: ["read", "ai"] satisfies readonly IntegrationCapability[],
  userConnectionRequired: false,
  serverSideOnly: true,
  scopes: [],
} satisfies IntegrationDefinition;

export const ACADEMIC_WRITING_TOOLKIT_OPERATIONS = [
  "audit_citations",
  "check_british_english",
  "review_paragraph_logic",
  "verify_bibtex_references",
  "create_reading_note_template",
] as const;

export type AcademicWritingToolkitOperation =
  (typeof ACADEMIC_WRITING_TOOLKIT_OPERATIONS)[number];

export type AcademicWritingToolkitRequest = {
  readonly operation: AcademicWritingToolkitOperation;
  readonly input: Record<string, unknown>;
};

export function toIntegrationToolRequest(
  request: AcademicWritingToolkitRequest,
): IntegrationToolRequest {
  return {
    providerId: ACADEMIC_WRITING_TOOLKIT_PROVIDER_ID,
    tool: request.operation,
    input: request.input,
  };
}

/**
 * Type-safe boundary for a host-provided MCP bridge.
 *
 * The web application must never receive or manufacture ChatGPT/MCP
 * credentials. The host is responsible for supplying the gateway.
 */
export interface AcademicWritingToolkitGateway
  extends Pick<ExternalIntegrationGateway, "execute"> {
  execute(
    subjectId: string,
    request: IntegrationToolRequest,
  ): Promise<IntegrationToolResult>;
}
