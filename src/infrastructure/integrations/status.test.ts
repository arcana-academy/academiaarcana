import { beforeEach, describe, expect, it } from "vitest";

import { CHATGPT_PLUGIN_CATALOG } from "./chatgpt-plugin-catalog";
import { getIntegrationStatusSnapshot } from "./status";

describe("integration status snapshot", () => {
  beforeEach(() => {
    delete process.env.PARALLEL_API_KEY;
    delete process.env.EXA_API_KEY;
  });
  it("reports the complete catalog and a verified GitHub connection", async () => {
    const snapshot = await getIntegrationStatusSnapshot({
      githubVerifier: () =>
        Promise.resolve({
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

    expect(snapshot.catalogSize).toBe(CHATGPT_PLUGIN_CATALOG.length + 2);
    expect(snapshot.connectedCount).toBe(1);
    expect(snapshot.cataloguedCount).toBe(
      CHATGPT_PLUGIN_CATALOG.length + 1,
    );
    expect(snapshot.errorCount).toBe(0);
    expect(snapshot.serverRuntimeIntegrations).toMatchObject([
      {
        providerId: "parallel-web-research",
        name: "Parallel — Web Research do Mestre Arcano",
        source: "runtime",
        status: "catalogued",
        executionMode: "runtime",
        configuration: "not-configured",
      },
      {
        providerId: "exa-web-research",
        name: "Exa — Web Research do Mestre Arcano",
        source: "runtime",
        status: "catalogued",
        executionMode: "runtime",
        configuration: "not-configured",
      },
    ]);

    expect(snapshot.runtimeIntegrations).toMatchObject([
      {
        providerId: "openai-agents",
        name: "OpenAI Agents — Mestre Arcano",
        status: "not_configured",
        executionMode: "runtime",
      },
    ]);

    const brainCells = snapshot.entries.find(
      (entry) => entry.name === "1 Billion Brain Cells",
    );
    expect(brainCells).toMatchObject({
      name: "1 Billion Brain Cells",
      executionMode: "catalog-only",
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
      executionMode: "chatgpt-hosted",
      providerId: "tarteel",
      capabilities: [
        "ayah-search",
        "ayah-translation",
        "ayah-tafsir",
        "ayah-mutashabihat",
        "phrase-mutashabihat",
        "recitation",
        "prayer-times",
      ],
      verification: null,
    });
    expect(tarteel?.chatgptAppUrl).toBeUndefined();

    const agenticCourseRedesign = snapshot.entries.find(
      (entry) => entry.name === "Agentic Course Redesign",
    );
    expect(agenticCourseRedesign).toMatchObject({
      name: "Agentic Course Redesign",
      status: "catalogued",
      executionMode: "chatgpt-hosted",
      providerId: "agentic-course-redesign",
      verification: null,
    });

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

    const outlook = snapshot.entries.find((entry) => entry.name === "Outlook Calendar");
    expect(outlook).toMatchObject({
      name: "Outlook Calendar",
      source: "runtime",
      status: "catalogued",
      executionMode: "runtime",
      providerId: "outlook-calendar",
      capabilities: ["read", "write", "search", "calendar"],
      verification: null,
    });

    const asana = snapshot.entries.find((entry) => entry.name === "Asana");
    expect(asana).toMatchObject({
      name: "Asana",
      source: "runtime",
      status: "catalogued",
      executionMode: "runtime",
      providerId: "asana",
      capabilities: ["read", "write", "search"],
      verification: null,
    });

    const airtable = snapshot.entries.find((entry) => entry.name === "Airtable");
    expect(airtable).toMatchObject({
      name: "Airtable",
      source: "runtime",
      status: "catalogued",
      executionMode: "runtime",
      providerId: "airtable",
      capabilities: ["read", "write", "search", "metadata", "analytics"],
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

  it("runs independent provider verifications concurrently", async () => {
    let started = 0;
    let release!: () => void;
    const allStarted = new Promise<void>((resolve) => {
      release = resolve;
    });

    const verifier = <T,>(result: T) => async () => {
      started += 1;
      if (started === 4) release();
      await allStarted;
      return result;
    };

    const snapshotPromise = getIntegrationStatusSnapshot({
      githubVerifier: verifier({
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
      dataCampVerifier: verifier({
        providerId: "datacamp",
        endpoint: "https://api.datacamp.com",
        status: "connected",
        verifiedAt: "2026-09-27T00:00:00.000Z",
      }),
      dropboxVerifier: verifier({
        providerId: "dropbox",
        accountId: "account-1",
        status: "connected",
        verifiedAt: "2026-09-27T00:00:00.000Z",
      }),
      airtableVerifier: verifier({
        providerId: "airtable",
        baseId: "base-1",
        tableCount: 1,
        status: "connected",
        verifiedAt: "2026-09-27T00:00:00.000Z",
      }),
      dataCampApiKey: "configured",
      dropboxToken: "configured",
      airtableToken: "configured",
      airtableBaseId: "base-1",
    });

    await allStarted;
    expect(started).toBe(4);
    await snapshotPromise;
  });

  it("surfaces server provider configuration without marking it verified", async () => {
    process.env.PARALLEL_API_KEY = "configured";
    process.env.EXA_API_KEY = "configured";

    const snapshot = await getIntegrationStatusSnapshot({
      githubVerifier: () =>
        Promise.resolve({
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

    expect(snapshot.serverRuntimeIntegrations).toMatchObject([
      {
        providerId: "parallel-web-research",
        configuration: "configured",
        status: "catalogued",
        verification: null,
      },
      {
        providerId: "exa-web-research",
        configuration: "configured",
        status: "catalogued",
        verification: null,
      },
    ]);
  });

  it("fails closed for provider errors without exposing provider details", async () => {
    const snapshot = await getIntegrationStatusSnapshot({
      githubVerifier: () => Promise.reject(new Error("secret network diagnostics")),
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
