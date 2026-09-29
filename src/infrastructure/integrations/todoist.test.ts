import { describe, expect, it, vi } from "vitest";

import {
  TODOIST_INTEGRATION_DEFINITION,
  buildTodoistAuthorizationUrl,
  createOAuthState,
  createOAuthVerifier,
  createPkceChallenge,
  createTodoistTask,
  exchangeTodoistAuthorizationCode,
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

    const state = createOAuthState();
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

  it("exchanges an authorization code server-side", async () => {
    vi.stubEnv("TODOIST_CLIENT_ID", "client-id");
    vi.stubEnv("TODOIST_CLIENT_SECRET", "client-secret");
    vi.stubEnv("TODOIST_REDIRECT_URI", "https://example.com/api/integrations/todoist/callback");

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ access_token: "access-token", token_type: "Bearer" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await exchangeTodoistAuthorizationCode({
      code: "authorization-code",
      codeVerifier: "verifier",
    });

    expect(result).toEqual({ accessToken: "access-token", tokenType: "Bearer" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.todoist.com/oauth/access_token",
      expect.objectContaining({
        method: "POST",
        body: expect.any(URLSearchParams),
      }),
    );
  });

  it("never returns the bearer token from connection verification", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ id: "user-123", fullName: "Arcana Learner" }), {
        status: 200,
      }),
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
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.todoist.com/api/v1/tasks",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          content: "Estudar",
          due_datetime: "2026-09-30T14:00:00.000Z",
        }),
      }),
    );
  });
});
