import { describe, expect, it } from "vitest";

import { getIntegrationStatusSnapshot } from "./status";

describe("Dropbox integration status", () => {
  it("reports Dropbox as connected only after explicit runtime verification", async () => {
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
        verifiedAt: "2026-09-29T00:00:00.000Z",
      }),
      dropboxToken: "runtime-token",
      dropboxVerifier: async () => ({
        providerId: "dropbox",
        pluginName: "Dropbox",
        status: "connected",
        accountId: "dbid:test",
        verifiedAt: "2026-09-29T00:00:00.000Z",
      }),
      dataCampApiKey: "",
    });

    const dropbox = snapshot.entries.find((entry) => entry.name === "Dropbox");
    expect(dropbox).toMatchObject({
      status: "connected",
      executionMode: "runtime",
      providerId: "dropbox",
      verification: { providerId: "dropbox", accountId: "dbid:test" },
    });
  });
});
