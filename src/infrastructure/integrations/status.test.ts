import { describe, expect, it } from "vitest";

import { CHATGPT_PLUGIN_CATALOG } from "./chatgpt-plugin-catalog";
import { getIntegrationStatusSnapshot } from "./status";

describe("integration status snapshot", () => {
  it("reports the complete catalog and a verified GitHub connection", async () => {
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

    expect(snapshot.catalogSize).toBe(CHATGPT_PLUGIN_CATALOG.length);
    expect(snapshot.connectedCount).toBe(1);
    expect(snapshot.cataloguedCount).toBe(
      CHATGPT_PLUGIN_CATALOG.length - 1,
    );
    expect(snapshot.errorCount).toBe(0);

    const github = snapshot.entries.find((entry) => entry.name === "GitHub");
    expect(github).toMatchObject({
      name: "GitHub",
      status: "connected",
      verification: {
        providerId: "github",
        repository: "arcana-academy/academiaarcana",
      },
    });
  });

  it("fails closed for provider errors without exposing provider details", async () => {
    const snapshot = await getIntegrationStatusSnapshot({
      githubVerifier: async () => {
        throw new Error("secret network diagnostics");
      },
    });

    const github = snapshot.entries.find((entry) => entry.name === "GitHub");

    expect(github).toMatchObject({
      name: "GitHub",
      status: "error",
      verification: null,
    });
    expect(snapshot.connectedCount).toBe(0);
    expect(snapshot.errorCount).toBe(1);
  });
});
