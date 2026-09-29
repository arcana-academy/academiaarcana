import { describe, expect, it, vi } from "vitest";
import {
  MICROSOFT_SHAREPOINT_INTEGRATION_DEFINITION,
  buildMicrosoftSharePointAuthorizationUrl,
  createMicrosoftPkceChallenge,
  createMicrosoftOAuthVerifier,
  MicrosoftSharePointConnectionError,
  executeMicrosoftSharePointOperation,
  searchMicrosoftSharePoint,
  verifyMicrosoftSharePointConnection,
  refreshMicrosoftSharePointCredentials,
  listMicrosoftSharePointSites,
} from "./microsoft-sharepoint";

describe("Microsoft SharePoint integration", () => {
  it("declares server-side OAuth capabilities without write access", () => {
    expect(MICROSOFT_SHAREPOINT_INTEGRATION_DEFINITION.authMode).toBe("oauth2");
    expect(MICROSOFT_SHAREPOINT_INTEGRATION_DEFINITION.serverSideOnly).toBe(true);
    expect(MICROSOFT_SHAREPOINT_INTEGRATION_DEFINITION.capabilities).toEqual(
      expect.arrayContaining(["read", "search", "files", "versions", "metadata"]),
    );
    expect(MICROSOFT_SHAREPOINT_INTEGRATION_DEFINITION.scopes).toEqual(
      expect.arrayContaining(["Files.Read", "Sites.Read.All"]),
    );
  });

  it("builds a PKCE authorization URL without exposing a client secret", async () => {
    vi.stubEnv("MICROSOFT_CLIENT_ID", "client-id");
    vi.stubEnv("MICROSOFT_REDIRECT_URI", "https://example.test/api/integrations/microsoft-sharepoint/callback");
    const verifier = createMicrosoftOAuthVerifier();
    const challenge = await createMicrosoftPkceChallenge(verifier);
    const url = new URL(buildMicrosoftSharePointAuthorizationUrl({ state: "state", codeChallenge: challenge }));
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("code_challenge")).toBe(challenge);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("scope")).toContain("Sites.Read.All");
    expect(url.search).not.toContain("client_secret");
    vi.unstubAllEnvs();
  });

  it("fails closed when no access token is available", async () => {
    await expect(verifyMicrosoftSharePointConnection("")).rejects.toBeInstanceOf(
      MicrosoftSharePointConnectionError,
    );
  });

  it("rejects empty searches before calling Graph", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(searchMicrosoftSharePoint("   ", "token")).rejects.toThrow(
      "A busca do SharePoint não pode estar vazia.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockRestore();
  });

  it("uses Graph's drive search endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ value: [] }), { status: 200 }),
    );

    await executeMicrosoftSharePointOperation("search", { query: "grimório" }, "token");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/me/drive/root/search(q='"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
      }),
    );

    fetchMock.mockRestore();
  });
});

  it("discovers SharePoint sites through Microsoft Graph", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ value: [{ id: "site-1" }] }), { status: 200 }),
    );
    await listMicrosoftSharePointSites("token");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/sites?search=*"),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer token" }) }),
    );
    fetchMock.mockRestore();
  });

  it("refreshes an expiring OAuth credential and preserves a rotated refresh token", async () => {
    vi.stubEnv("MICROSOFT_CLIENT_ID", "client-id");
    vi.stubEnv("MICROSOFT_CLIENT_SECRET", "client-secret");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ access_token: "new-access-token", refresh_token: "new-refresh-token", expires_in: 3600 }), { status: 200 }),
    );
    const credentials = await refreshMicrosoftSharePointCredentials({
      subjectId: "user-1", accessToken: "old-access-token", refreshToken: "old-refresh-token", accessTokenExpiresAt: Date.now() - 1,
    });
    expect(credentials.accessToken).toBe("new-access-token");
    expect(credentials.refreshToken).toBe("new-refresh-token");
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/oauth2/v2.0/token"), expect.objectContaining({ method: "POST" }));
    fetchMock.mockRestore();
    vi.unstubAllEnvs();
  });
});
