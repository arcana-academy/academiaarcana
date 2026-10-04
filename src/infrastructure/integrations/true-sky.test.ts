import { describe, expect, it } from "vitest";

import {
  TRUE_SKY_INTEGRATION_DEFINITION,
  TRUE_SKY_OPERATIONS,
  TRUE_SKY_PLUGIN_NAME,
  TRUE_SKY_PROVIDER_ID,
  toTrueSkyIntegrationToolRequest,
} from "./true-sky";

describe("True Sky integration boundary", () => {
  it("declares all supported astrology operations", () => {
    expect(TRUE_SKY_OPERATIONS).toEqual([
      "get_natal_chart_data",
      "get_transit_data",
      "generate_horoscope",
      "generate_natal_chart_reading",
      "get_synastry_data",
      "get_composite_data",
      "get_return_data",
    ]);
  });

  it("uses an MCP-only server-side integration definition", () => {
    expect(TRUE_SKY_INTEGRATION_DEFINITION).toMatchObject({
      id: TRUE_SKY_PROVIDER_ID,
      displayName: TRUE_SKY_PLUGIN_NAME,
      authMode: "mcp",
      userConnectionRequired: false,
      serverSideOnly: true,
      scopes: [],
    });
  });

  it("normalizes tool requests without credentials", () => {
    expect(
      toTrueSkyIntegrationToolRequest({
        operation: "get_natal_chart_data",
        input: {
          name: "Example",
          birthDate: "2000-01-01",
          birthTime: "12:00",
          birthLocation: "London, England, United Kingdom",
        },
      }),
    ).toEqual({
      providerId: TRUE_SKY_PROVIDER_ID,
      tool: "get_natal_chart_data",
      input: {
        name: "Example",
        birthDate: "2000-01-01",
        birthTime: "12:00",
        birthLocation: "London, England, United Kingdom",
      },
    });
  });
});
