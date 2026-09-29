import { describe, expect, it } from "vitest";

import {
  EXA_WEB_RESEARCH_INTEGRATION_DEFINITION,
  EXA_WEB_RESEARCH_PROVIDER_ID,
} from "./exa-web-research";

describe("Exa web research integration", () => {
  it("declares an API-key, server-side search provider", () => {
    expect(EXA_WEB_RESEARCH_INTEGRATION_DEFINITION).toMatchObject({
      id: EXA_WEB_RESEARCH_PROVIDER_ID,
      authMode: "api_key",
      capabilities: ["search"],
      userConnectionRequired: false,
      serverSideOnly: true,
      scopes: [],
    });
  });
});
