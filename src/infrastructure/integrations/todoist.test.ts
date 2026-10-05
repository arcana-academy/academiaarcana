import { describe, expect, it, vi } from "vitest";

import {
  TODOIST_INTEGRATION_DEFINITION,
  buildTodoistAuthorizationUrl,
  createOAuthVerifier,
  createPkceChallenge,
  createTodoistTask,
  decryptTodoistCredentials,
  encryptTodoistCredentials,
  exchangeTodoistAuthorizationCode,
  refreshTodoistCredentials,
  shouldRefreshTodoistCredentials,
  verifyTodoistConnection,
} from "./todoist";

describe("Todoist integration", () => {
  it("uses OAuth with the minimum scope required for two-way task workflows", () => {
    expect(TODOIST_INTEGRATION_DEFINITION).toMatchObject({
      id: "todoist",
      authMode: "oauth2",
      userConnectionRequired: true,
      serverSideOnly: true,
      capabilities: ["read", "write", "search", "calendar"],
      scopes: ["data:read_write"],
    });
  });

  it("builds a CSRF-protected PKCE authorization URL without exposing secrets", async () => {
    vi.stubEnv("TODOIST_CLIENT_ID", "client-id");
    vi.stubEnv("TODOIST_REDIRECT_URI", "https://example.com/api/integrations/todoist/callback");

    const state = "state-value";
    const verifier = createOAuthVerifier();
    const challenge = await createPkceChallenge(verifier);
    const url = new URL(
      buildTodoistAuthorizationUrl({
        state,
        codeChallenge: challenge,
      }),
    );

    expect(url.origin).toBe("https://app.todoist.com");
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("state")).toBe(state);
    expect(url.searchParams.get("code_challenge")).toBe(challenge);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.has("client_secret")).toBe(false);
  });

  it("exchanges an authorization code server-side and accepts refresh-token responses", async () => {
    vi.stubEnv("TODOIST_CLIENT_ID", "client-id");
    vi.stubEnv("TODOIST_CLIENT_SECRET", "client-secret");
    vi.stubEnv("TODOIST_REDIRECT_URI", "https://example.com/api/integrations/todoist/callback");

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({
        access_token: "access-token",
        token_type: "Bearer",
        refresh_token: "refresh-token",
        expires_in: 3600,
      }), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await exchangeTodoistAuthorizationCode({
      code: "authorization-code",
      codeVerifier: "verifier",
      requestUrl: "https://example.com/api/integrations/todoist/callback",
    });

    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
    expect(result.accessTokenExpiresAt).toBeGreaterThan(Date.now());
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.todoist.com/oauth/access_token",
      expect.objectContaining({ method: "POST", body: expect.any(URLSearchParams) }),
    );
  });

  it("encrypts credentials without exposing bearer values in the cookie", async () => {
    vi.stubEnv("TODOIST_CLIENT_SECRET", "cookie-encryption-secret");

    const credentials = {
      subjectId: "academy-user-1",
      accessToken: "secret-access-token",
      refreshToken: "secret-refresh-token",
      accessTokenExpiresAt: Date.now() + 3_600_000,
    };

    const encoded = await encryptTodoistCredentials(credentials);
    expect(encoded).not.toContain(credentials.accessToken);
    expect(encoded).not.toContain(credentials.refreshToken);
    expect(await decryptTodoistCredentials(encoded)).toEqual(credentials);
  });

  it("rejects invalid encrypted credential payloads", async () => {
    vi.stubEnv("TODOIST_CLIENT_SECRET", "cookie-encryption-secret");
    expect(await decryptTodoistCredentials("invalid-cookie-value")).toBeNull();
  });

  it("recognizes expiring refreshable credentials", () => {
    const now = Date.now();
    expect(shouldRefreshTodoistCredentials({
      subjectId: "academy-user-1",
      accessToken: "access",
      refreshToken: "refresh",
      accessTokenExpiresAt: now + 30_000,
    }, now)).toBe(true);
    expect(shouldRefreshTodoistCredentials({
      subjectId: "academy-user-1",
      accessToken: "access",
      refreshToken: "refresh",
      accessTokenExpiresAt: now + 120_000,
    }, now)).toBe(false);
  });

  it("refreshes an access token and rotates the refresh token", async () => {
    vi.stubEnv("TODOIST_CLIENT_ID", "client-id");
    vi.stubEnv("TODOIST_CLIENT_SECRET", "client-secret");

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({
        access_token: "new-access",
        refresh_token: "new-refresh",
        expires_in: 3600,
      }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await refreshTodoistCredentials({
      subjectId: "academy-user-1",
      accessToken: "old-access",
      refreshToken: "old-refresh",
      accessTokenExpiresAt: Date.now() - 1000,
    });

    expect(result.subjectId).toBe("academy-user-1");
    expect(result.accessToken).toBe("new-access");
    expect(result.refreshToken).toBe("new-refresh");
    expect(result.accessTokenExpiresAt).toBeGreaterThan(Date.now());
  });

  it("never returns the bearer token from connection verification", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ id: "user-123", fullName: "Arcana Learner" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await verifyTodoistConnection("secret-token");

    expect(result).toMatchObject({
      providerId: "todoist",
      user: { id: "user-123", fullName: "Arcana Learner" },
    });
    expect(JSON.stringify(result)).not.toContain("secret-token");
  });

  it("creates a task with the Todoist API", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ id: "task-1", content: "Estudar" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await createTodoistTask("secret-token", {
      content: "Estudar",
      dueDateTime: "2026-09-30T14:00:00.000Z",
      durationMinutes: 30,
      priority: 2,
      projectId: "project-1",
      labels: ["academia-arcana"],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.todoist.com/api/v1/tasks",
      expect.objectContaining({ method: "POST" }),
    );

    const requestInit = (fetchMock.mock.calls as unknown as Array<[string, RequestInit]>)[0]?.[1];
    expect(requestInit).toBeDefined();
    expect(JSON.parse(String(requestInit?.body))).toEqual({
      content: "Estudar",
      due_datetime: "2026-09-30T14:00:00.000Z",
      project_id: "project-1",
      priority: 2,
      labels: ["academia-arcana"],
      duration: 30,
      duration_unit: "minute",
    });
  });
});