import { describe, expect, it, vi } from "vitest";

import {
  TRELLO_INTEGRATION_DEFINITION,
  buildTrelloAuthorizationUrl,
  createOAuthVerifier,
  createPkceChallenge,
  decryptTrelloCredentials,
  encryptTrelloCredentials,
  exchangeTrelloAuthorizationCode,
  getTrelloBoards,
  createTrelloCard,
  refreshTrelloCredentials,
  shouldRefreshTrelloCredentials,
  verifyTrelloConnection,
} from "./trello";

describe("Trello integration", () => {
  it("defines a server-side OAuth 2.0 runtime integration", () => {
    expect(TRELLO_INTEGRATION_DEFINITION).toMatchObject({
      id: "trello",
      authMode: "oauth2",
      userConnectionRequired: true,
      serverSideOnly: true,
      capabilities: ["read", "write", "search", "metadata"],
      scopes: [
        "read:member:trello",
        "read:board:trello",
        "write:board:trello",
        "offline_access",
      ],
    });
  });

  it("builds the authorization URL with PKCE and no client secret", async () => {
    vi.stubEnv("TRELLO_CLIENT_ID", "client-id");
    vi.stubEnv(
      "TRELLO_REDIRECT_URI",
      "https://example.com/api/integrations/trello/callback",
    );

    const state = "state-value";
    const verifier = createOAuthVerifier();
    const challenge = await createPkceChallenge(verifier);
    const url = new URL(
      buildTrelloAuthorizationUrl({ state, codeChallenge: challenge }),
    );

    expect(url.origin).toBe("https://auth.atlassian.com");
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("scope")).toContain("read:board:trello");
    expect(url.searchParams.get("state")).toBe(state);
    expect(url.searchParams.get("code_challenge")).toBe(challenge);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("prompt")).toBe("consent");
    expect(url.searchParams.has("client_secret")).toBe(false);
  });

  it("exchanges authorization codes server-side", async () => {
    vi.stubEnv("TRELLO_CLIENT_ID", "client-id");
    vi.stubEnv("TRELLO_CLIENT_SECRET", "client-secret");
    vi.stubEnv(
      "TRELLO_REDIRECT_URI",
      "https://example.com/api/integrations/trello/callback",
    );

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: "access-token",
          refresh_token: "refresh-token",
          expires_in: 3600,
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await exchangeTrelloAuthorizationCode({
      code: "authorization-code",
      codeVerifier: "verifier",
      requestUrl: "https://example.com/api/integrations/trello/callback",
    });

    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
    expect(result.accessTokenExpiresAt).toBeGreaterThan(Date.now());
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      grant_type: "authorization_code",
      client_id: "client-id",
      client_secret: "client-secret",
      code_verifier: "verifier",
    });
  });

  it("encrypts credentials without exposing bearer values", async () => {
    vi.stubEnv("TRELLO_CLIENT_SECRET", "cookie-encryption-secret");

    const credentials = {
      subjectId: "academy-user-1",
      accessToken: "secret-access-token",
      refreshToken: "secret-refresh-token",
      accessTokenExpiresAt: Date.now() + 3_600_000,
    };

    const encoded = await encryptTrelloCredentials(credentials);
    expect(encoded).not.toContain(credentials.accessToken);
    expect(encoded).not.toContain(credentials.refreshToken);
    expect(await decryptTrelloCredentials(encoded)).toEqual(credentials);
  });

  it("recognizes expiring refreshable credentials", () => {
    const now = Date.now();
    expect(
      shouldRefreshTrelloCredentials(
        {
          subjectId: "academy-user-1",
          accessToken: "access",
          refreshToken: "refresh",
          accessTokenExpiresAt: now + 30_000,
        },
        now,
      ),
    ).toBe(true);
  });

  it("refreshes access tokens and preserves subject ownership", async () => {
    vi.stubEnv("TRELLO_CLIENT_ID", "client-id");
    vi.stubEnv("TRELLO_CLIENT_SECRET", "client-secret");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            access_token: "new-access",
            refresh_token: "new-refresh",
            expires_in: 3600,
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await refreshTrelloCredentials({
      subjectId: "academy-user-1",
      accessToken: "old-access",
      refreshToken: "old-refresh",
      accessTokenExpiresAt: Date.now() - 1000,
    });

    expect(result).toMatchObject({
      subjectId: "academy-user-1",
      accessToken: "new-access",
      refreshToken: "new-refresh",
    });
  });

  it("verifies the member without returning the bearer token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            id: "member-1",
            fullName: "Arcana Learner",
            username: "arcana-learner",
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await verifyTrelloConnection("secret-token");
    expect(result).toMatchObject({
      providerId: "trello",
      user: { id: "member-1", fullName: "Arcana Learner" },
    });
    expect(JSON.stringify(result)).not.toContain("secret-token");
  });

  it("lists boards through the Trello API", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify([
          {
            id: "board-1",
            name: "Academia Arcana",
            url: "https://trello.com/b/board-1/academia-arcana",
            closed: false,
          },
        ]),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getTrelloBoards("secret-token");
    expect(result.output).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.trello.com/1/members/me/boards?filter=open&fields=id,name,desc,url,closed",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
  });

  it("creates cards against an explicit list", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "card-1",
          idBoard: "board-1",
          idList: "list-1",
          name: "Validar acessibilidade",
          closed: false,
          pos: 1,
          url: "https://trello.com/c/card-1/validar-acessibilidade",
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await createTrelloCard("secret-token", {
      listId: "list-1",
      name: "Validar acessibilidade",
    });

    const request = fetchMock.mock.calls.at(-1)?.[1] as RequestInit | undefined;
    expect(JSON.parse(String(request?.body))).toEqual({
      idList: "list-1",
      name: "Validar acessibilidade",
    });
  });
});
