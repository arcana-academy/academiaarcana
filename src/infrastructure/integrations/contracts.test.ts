import { describe, expect, it } from "vitest";
import type {
  ExternalIntegrationGateway,
  IntegrationCredentialStore,
  IntegrationDefinition,
  IntegrationScopeVerifier,
} from "./contracts";

describe("external integration contracts", () => {
  it("keeps integration definitions vendor-neutral", () => {
    const definition: IntegrationDefinition = {
      id: "example",
      displayName: "Example",
      authMode: "oauth2",
      capabilities: ["read"],
      userConnectionRequired: true,
      serverSideOnly: true,
      scopes: ["read"],
    };

    expect(definition.serverSideOnly).toBe(true);
    expect(definition.authMode).toBe("oauth2");
    expect(definition.scopes).toEqual(["read"]);
  });

  it("requires independent interfaces for credentials, scope checks and execution", () => {
    const credentialStore: IntegrationCredentialStore = {
      getAccessToken: () => Promise.resolve(null),
      revoke: () => Promise.resolve(),
    };
    const scopeVerifier: IntegrationScopeVerifier = {
      verify: () => Promise.resolve(false),
    };
    const gateway: ExternalIntegrationGateway = {
      execute: async (subjectId, request) => ({
        providerId: request.providerId,
        tool: request.tool,
        output: { subjectId, input: request.input },
      }),
    };

    expect(credentialStore).toBeDefined();
    expect(scopeVerifier).toBeDefined();
    expect(gateway).toBeDefined();
  });
});
