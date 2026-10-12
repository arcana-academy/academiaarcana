import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ASANA_OAUTH_AUTHORIZE_URL,
  ASANA_OAUTH_SCOPES,
  buildAsanaAuthorizationUrl,
  createAsanaOAuthVerifier,
  createAsanaPkceChallenge,
  decryptAsanaCredentials,
  encryptAsanaCredentials,
  shouldRefreshAsanaCredentials,
  refreshAsanaCredentials,
  AsanaConnectionError,
} from "./asana";

describe("Asana integration adapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("builds an OAuth URL with state, PKCE and the documented scopes", () => {
    vi.stubEnv("ASANA_CLIENT_ID", "client-id");
    vi.stubEnv("ASANA_REDIRECT_URI", "https://example.com/api/integrations/asana/callback");

    const url = new URL(
      buildAsanaAuthorizationUrl({
        state: "state-value",
        codeChallenge: "challenge-value",
      }),
    );

    expect(url.origin + url.pathname).toBe(ASANA_OAUTH_AUTHORIZE_URL);
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("state")).toBe("state-value");
    expect(url.searchParams.get("code_challenge")).toBe("challenge-value");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("scope")).toBe(ASANA_OAUTH_SCOPES.join(" "));
  });

  it("generates a non-empty random PKCE verifier", () => {
    const verifier = createAsanaOAuthVerifier();

    expect(verifier).toBeTruthy();
  });

  it("generates a deterministic S256 PKCE challenge", async () => {
    const first = await createAsanaPkceChallenge("known-verifier");
    const second = await createAsanaPkceChallenge("known-verifier");

    expect(first).toBe(second);
    expect(first).toBeTruthy();
  });

  it("encrypts and decrypts credentials without changing their shape", async () => {
    vi.stubEnv("ASANA_CLIENT_SECRET", "test-secret");

    const credentials = {
      subjectId: "user-123",
      accessToken: "access-token",
      refreshToken: "refresh-token",
      accessTokenExpiresAt: 1_900_000_000_000,
    };

    const encrypted = await encryptAsanaCredentials(credentials);

    expect(encrypted).not.toContain(credentials.accessToken);
    expect(await decryptAsanaCredentials(encrypted)).toEqual(credentials);
  });

  it("rejects malformed credential payloads", async () => {
    vi.stubEnv("ASANA_CLIENT_SECRET", "test-secret");

    expect(await decryptAsanaCredentials("not-a-valid-credential")).toBeNull();
  });

  it("refreshes only when an expiring access token has a refresh token", () => {
    const now = 1_900_000_000_000;

    expect(
      shouldRefreshAsanaCredentials({
        subjectId: "user",
        accessToken: "token",
        refreshToken: "refresh",
        accessTokenExpiresAt: now + 30_000,
      }, now),
    ).toBe(true);

    expect(
      shouldRefreshAsanaCredentials({
        subjectId: "user",
        accessToken: "token",
        refreshToken: null,
        accessTokenExpiresAt: now + 30_000,
      }, now),
    ).toBe(false);
  });
  it("retains the previous refresh token when a successful OAuth refresh omits a replacement", async () => {
    vi.stubEnv("ASANA_CLIENT_ID", "synthetic-client");
    vi.stubEnv("ASANA_CLIENT_SECRET", "synthetic-secret");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: "renewed-access", expires_in: 3600 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const previous = {
      subjectId: "user-1",
      accessToken: "expired-access",
      refreshToken: "existing-refresh",
      accessTokenExpiresAt: 0,
    };

    const result = await refreshAsanaCredentials(previous);

    expect(result.subjectId).toBe("user-1");
    expect(result.accessToken).toBe("renewed-access");
    expect(result.refreshToken).toBe("existing-refresh");
    expect(result.accessTokenExpiresAt).toBeGreaterThan(Date.now());
    expect(previous.refreshToken).toBe("existing-refresh");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0];
    expect((options?.body as URLSearchParams).get("refresh_token")).toBe("existing-refresh");
  });

  it("replaces the previous refresh token when OAuth explicitly rotates it", async () => {
    vi.stubEnv("ASANA_CLIENT_ID", "synthetic-client");
    vi.stubEnv("ASANA_CLIENT_SECRET", "synthetic-secret");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          access_token: "rotated-access",
          refresh_token: "rotated-refresh",
          expires_in: 1800,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await refreshAsanaCredentials({
      subjectId: "user-1",
      accessToken: "expired-access",
      refreshToken: "previous-refresh",
      accessTokenExpiresAt: 0,
    });
    expect(result).toMatchObject({
      subjectId: "user-1",
      accessToken: "rotated-access",
      refreshToken: "rotated-refresh",
    });
  });

  it("does not accept a refresh response without a valid access token", async () => {
    vi.stubEnv("ASANA_CLIENT_ID", "synthetic-client");
    vi.stubEnv("ASANA_CLIENT_SECRET", "synthetic-secret");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ expires_in: 3600 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await expect(
      refreshAsanaCredentials({
        subjectId: "user-1",
        accessToken: "expired-access",
        refreshToken: "previous-refresh",
        accessTokenExpiresAt: 0,
      }),
    ).rejects.toBeInstanceOf(AsanaConnectionError);
  });

});
