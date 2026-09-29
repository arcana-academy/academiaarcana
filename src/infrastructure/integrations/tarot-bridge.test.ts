import { describe, expect, it } from "vitest";

import { CHATGPT_PLUGIN_CATALOG } from "./chatgpt-plugin-catalog";
import {
  CHATGPT_APP_BRIDGES,
  TAROT_APP_ID,
  TAROT_CHATGPT_APP_URL,
} from "./chatgpt-app-bridges";
import { getIntegrationStatusSnapshot } from "./status";

describe("Tarot integration bridge", () => {
  it("matches the catalog and the verified official ChatGPT app URL", () => {
    expect(CHATGPT_PLUGIN_CATALOG.some((entry) => entry.name === "Tarot")).toBe(
      true,
    );
    expect(CHATGPT_APP_BRIDGES[TAROT_APP_ID]).toEqual({
      providerId: TAROT_APP_ID,
      displayName: "Tarot",
      appUrl: TAROT_CHATGPT_APP_URL,
    });

    const url = new URL(TAROT_CHATGPT_APP_URL);
    expect(url.protocol).toBe("https:");
    expect(url.hostname).toBe("chatgpt.com");
  });

  it("exposes Tarot as a catalogued navigation bridge, not a fake runtime connection", async () => {
    const snapshot = await getIntegrationStatusSnapshot({
      githubVerifier: async () => ({
        providerId: "github",
        pluginName: "GitHub",
        status: "connected",
        repository: {
          fullName: "arcana-academy/academiaarcana",
          defaultBranch: "main",
          visibility: "public",
          private: false,
          htmlUrl: "https://github.com/arcana-academy/academiaarcana",
        },
        verifiedAt: "2026-09-27T00:00:00.000Z",
      }),
    });

    const tarot = snapshot.entries.find((entry) => entry.name === "Tarot");

    expect(tarot).toMatchObject({
      name: "Tarot",
      status: "catalogued",
      executionMode: "catalog-only",
      chatgptAppUrl: TAROT_CHATGPT_APP_URL,
      verification: null,
    });
  });
});
