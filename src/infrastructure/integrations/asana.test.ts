import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ASANA_OAUTH_AUTHORIZE_URL,
  ASANA_OAUTH_SCOPES,
  buildAsanaAuthorizationUrl,
  createAsanaOAuthState,
  createAsanaOAuthVerifier,
  createAsanaPkceChallenge,
  decryptAsanaCredentials,
  encryptAsanaCredentials,
  shouldRefreshAsanaCredentials,
} from "./asana";

describe("Asana integration adapter", () => {
  afterEach(() => {
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

  it("generates non-empty random state and verifier values", () => {
    const state = createAsanaOAuthState();
    const verifier = createAsanaOAuthVerifier();

    expect(state).toBeTruthy();
    expect(verifier).toBeTruthy();
    expect(state).not.toBe(verifier);
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
});
