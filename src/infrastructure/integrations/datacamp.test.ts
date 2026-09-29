import { describe, expect, it, vi } from "vitest";

import {
  DATACAMP_INTEGRATION_DEFINITION,
  DATACAMP_PROVIDER_ID,
  toDataCampIntegrationToolRequest,
  verifyDataCampConnection,
} from "./datacamp";

describe("DataCamp integration", () => {
  it("defines a server-side API-key integration", () => {
    expect(DATACAMP_INTEGRATION_DEFINITION).toMatchObject({
      id: DATACAMP_PROVIDER_ID,
      displayName: "DataCamp",
      authMode: "api_key",
      capabilities: ["read", "search", "analytics"],
      userConnectionRequired: false,
      serverSideOnly: true,
    });
  });

  it("maps application operations to the provider boundary", () => {
    expect(
      toDataCampIntegrationToolRequest({
        operation: "list_live_courses",
        input: { limit: 10 },
      }),
    ).toEqual({
      providerId: "datacamp",
      tool: "list_live_courses",
      input: { limit: 10 },
    });
  });

  it("verifies the catalog API without exposing the API key", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe(
        "https://lms-catalog-api.datacamp.com/v1/catalog/live-courses",
      );
      expect(init?.headers).toMatchObject({
        Accept: "application/json",
        Authorization: "Bearer secret-token",
      });

      return new Response(JSON.stringify({ courses: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const result = await verifyDataCampConnection({
      apiKey: "secret-token",
      fetchImpl,
    });

    expect(result).toMatchObject({
      providerId: "datacamp",
      pluginName: "DataCamp",
      status: "connected",
      endpoint:
        "https://lms-catalog-api.datacamp.com/v1/catalog/live-courses",
    });
    expect(JSON.stringify(result)).not.toContain("secret-token");
  });

  it("fails closed when the server key is missing", async () => {
    await expect(
      verifyDataCampConnection({ apiKey: "" }),
    ).rejects.toMatchObject({ httpStatus: 503 });
  });

  it("fails closed on an upstream authentication error", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 401 }));

    await expect(
      verifyDataCampConnection({ apiKey: "secret-token", fetchImpl }),
    ).rejects.toMatchObject({ httpStatus: 401 });
  });
});
