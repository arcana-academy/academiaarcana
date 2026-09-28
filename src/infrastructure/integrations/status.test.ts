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

    const brainCells = snapshot.entries.find(
      (entry) => entry.name === "1 Billion Brain Cells",
    );
    expect(brainCells).toMatchObject({
      name: "1 Billion Brain Cells",
      status: "catalogued",
      chatgptAppUrl:
        "https://chatgpt.com/plugins/plugin_asdk_app_69cd086370708191905606fa0641d238",
    });

    const dailyWord = snapshot.entries.find(
      (entry) => entry.name === "A-Z Daily Word",
    );
    expect(dailyWord).toMatchObject({
      name: "A-Z Daily Word",
      status: "catalogued",
      chatgptAppUrl:
        "https://chatgpt.com/plugins/plugin_asdk_app_69bd3c483c008191beb1e4cc0ce87b24",
      verification: null,
    });

    const dictionary = snapshot.entries.find(
      (entry) => entry.name === "A-Z Dictionary",
    );
    expect(dictionary).toMatchObject({
      name: "A-Z Dictionary",
      status: "catalogued",
      chatgptAppUrl:
        "https://chatgpt.com/plugins/plugin_asdk_app_6960e92ebfa481918f4ccff0c8b219db",
      verification: null,
    });

    const aceKnowledgeGraph = snapshot.entries.find(
      (entry) => entry.name === "Ace Knowledge Graph",
    );
    expect(aceKnowledgeGraph).toMatchObject({
      name: "Ace Knowledge Graph",
      status: "catalogued",
      verification: null,
    });

    const tarteel = snapshot.entries.find(
      (entry) => entry.name === "Tarteel",
    );
    expect(tarteel).toMatchObject({
      name: "Tarteel",
      status: "catalogued",
      verification: null,
    });
    expect(tarteel?.chatgptAppUrl).toBeUndefined();

    const spotify = snapshot.entries.find(
      (entry) => entry.name === "Spotify",
    );
    expect(spotify).toMatchObject({
      name: "Spotify",
      status: "catalogued",
      chatgptAppUrl:
        "https://chatgpt.com/plugins/plugin_asdk_app_68de829bf7648191acd70a907364c67c",
      verification: null,
    });

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
