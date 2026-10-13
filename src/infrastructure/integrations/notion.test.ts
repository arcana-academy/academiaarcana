import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildNotionAuthorizationUrl,
  decryptNotionCredentials,
  encryptNotionCredentials,
  NOTION_API_VERSION,
  NOTION_INTEGRATION_DEFINITION,
  NOTION_PROVIDER_ID,
  refreshNotionCredentials,
} from "./notion";

describe("Notion integration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    process.env.NOTION_CLIENT_ID = "notion-client-id";
    process.env.NOTION_CLIENT_SECRET = "notion-client-secret";
    process.env.NOTION_REDIRECT_URI =
      "https://academiaarcana.example/api/integrations/notion/callback";
  });

  it("declares a server-side OAuth integration", () => {
    expect(NOTION_INTEGRATION_DEFINITION).toMatchObject({
      id: NOTION_PROVIDER_ID,
      authMode: "oauth2",
      userConnectionRequired: true,
      serverSideOnly: true,
      capabilities: ["read", "write", "search", "metadata"],
    });
  });

  it("uses the current Notion API version", () => {
    expect(NOTION_API_VERSION).toBe("2026-03-11");
  });

  it("builds the public connection authorization URL", () => {
    const url = new URL(
      buildNotionAuthorizationUrl({
        state: "state-value",
      }),
    );

    expect(url.origin + url.pathname).toBe(
      "https://api.notion.com/v1/oauth/authorize",
    );
    expect(url.searchParams.get("client_id")).toBe("notion-client-id");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://academiaarcana.example/api/integrations/notion/callback",
    );
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("owner")).toBe("user");
    expect(url.searchParams.get("state")).toBe("state-value");
  });

  it("round-trips encrypted user-bound credentials", async () => {
    const credentials = {
      subjectId: "user-1",
      accessToken: "access-token",
      refreshToken: "refresh-token",
      botId: "bot-1",
      workspaceId: "workspace-1",
      workspaceName: "Arcana",
    };

    const encrypted = await encryptNotionCredentials(credentials);
    const decrypted = await decryptNotionCredentials(encrypted);

    expect(decrypted).toEqual(credentials);
  });

  it("rejects malformed credentials", async () => {
    expect(await decryptNotionCredentials("not-a-valid-token")).toBeNull();
  });
  const credentials = {
    subjectId: "synthetic-owner-1",
    accessToken: "original-access",
    refreshToken: "original-refresh",
    botId: "bot-synthetic",
    workspaceId: "workspace-synthetic",
    workspaceName: "Synthetic",
  };

  it.each([
    ["whitespace access token", { access_token: "  ", refresh_token: "rotated-refresh" }],
    ["non-string access token", { access_token: 42, refresh_token: "rotated-refresh" }],
  ])("rejects Notion refresh response with %s", async (_scenario, payload) => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify(payload), { status: 200 }),
    ));

    await expect(refreshNotionCredentials(credentials)).rejects.toThrow(
      "O Notion não devolveu um token renovado válido.",
    );
  });

  it("keeps a working refresh credential when Notion returns a blank replacement", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({
        access_token: "rotated-access",
        refresh_token: "  ",
      }), { status: 200 }),
    ));

    await expect(refreshNotionCredentials(credentials)).resolves.toMatchObject({
      subjectId: "synthetic-owner-1",
      accessToken: "rotated-access",
      refreshToken: "original-refresh",
    });
  });

  it("uses a real newly rotated refresh token without losing owner binding", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({
        access_token: "rotated-access",
        refresh_token: "rotated-refresh",
      }), { status: 200 }),
    ));

    await expect(refreshNotionCredentials(credentials)).resolves.toMatchObject({
      subjectId: "synthetic-owner-1",
      accessToken: "rotated-access",
      refreshToken: "rotated-refresh",
    });
  });

});
