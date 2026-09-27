/**
 * External integration contracts.
 *
 * These types deliberately do not depend on a vendor SDK. Each provider must
 * be implemented behind this boundary and invoked only from server-side
 * application/infrastructure code.
 */

export type IntegrationAuthMode =
  | "none"
  | "oauth2"
  | "api_key"
  | "service_token"
  | "mcp";

export type IntegrationCapability =
  | "read"
  | "write"
  | "search"
  | "files"
  | "calendar"
  | "messaging"
  | "design"
  | "deployment"
  | "database"
  | "payments"
  | "analytics"
  | "ai";

export type IntegrationConnectionStatus =
  | "disconnected"
  | "pending"
  | "connected"
  | "reauthorization_required"
  | "error";

export type IntegrationDefinition = {
  readonly id: string;
  readonly displayName: string;
  readonly authMode: IntegrationAuthMode;
  readonly capabilities: readonly IntegrationCapability[];
  readonly userConnectionRequired: boolean;
  readonly serverSideOnly: boolean;
  readonly scopes: readonly string[];
  readonly documentationUrl?: string;
};

export type IntegrationConnection = {
  readonly providerId: string;
  readonly status: IntegrationConnectionStatus;
  readonly grantedScopes: readonly string[];
  readonly expiresAt: string | null;
};

export type IntegrationToolRequest = {
  readonly providerId: string;
  readonly tool: string;
  readonly input: unknown;
};

export type IntegrationToolResult = {
  readonly providerId: string;
  readonly tool: string;
  readonly output: unknown;
};

export interface IntegrationCredentialStore {
  getAccessToken(providerId: string, subjectId: string): Promise<string | null>;
  revoke(providerId: string, subjectId: string): Promise<void>;
}

export interface IntegrationScopeVerifier {
  verify(
    providerId: string,
    subjectId: string,
    requiredScopes: readonly string[],
  ): Promise<boolean>;
}

export interface ExternalIntegrationGateway {
  execute(
    subjectId: string,
    request: IntegrationToolRequest,
  ): Promise<IntegrationToolResult>;
}
