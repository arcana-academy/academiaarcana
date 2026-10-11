import { afterEach, describe, expect, it, vi } from "vitest";

import {
  refreshTodoistCredentials,
  TodoistConnectionError,
} from "./todoist";

const credentials = {
  subjectId: "synthetic-owner",
  accessToken: "synthetic-old-access",
  refreshToken: "synthetic-refresh",
  accessTokenExpiresAt: Date.now() - 1000,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Todoist OAuth refresh error provenance", () => {
  it.each([401, 403, 429, 500, 503])("preserves refresh HTTP %i without exposing response body", async (status) => {
    vi.stubEnv("TODOIST_CLIENT_ID", "synthetic-client-id");
    vi.stubEnv("TODOIST_CLIENT_SECRET", "synthetic-client-secret");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("synthetic-secret-upstream-response", { status })),
    );

    let error: unknown;
    try {
      await refreshTodoistCredentials(credentials);
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(TodoistConnectionError);
    expect(error).toMatchObject({ httpStatus: status });
    expect((error as Error).message).not.toContain("synthetic-secret-upstream-response");
  });

  it("recognizes only a proven invalid_grant on a 400 response as token revocation", async () => {
    vi.stubEnv("TODOIST_CLIENT_ID", "synthetic-client-id");
    vi.stubEnv("TODOIST_CLIENT_SECRET", "synthetic-client-secret");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: "invalid_grant" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    await expect(refreshTodoistCredentials(credentials)).rejects.toMatchObject({
      httpStatus: 400,
      oauthError: "invalid_grant",
    });
  });

  it("does not classify generic HTTP 400 as a revoked token", async () => {
    vi.stubEnv("TODOIST_CLIENT_ID", "synthetic-client-id");
    vi.stubEnv("TODOIST_CLIENT_SECRET", "synthetic-client-secret");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: "incorrect_application_credentials" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    await expect(refreshTodoistCredentials(credentials)).rejects.toMatchObject({
      httpStatus: 400,
      oauthError: undefined,
    });
  });

  it("retains the owner when refresh succeeds", async () => {
    vi.stubEnv("TODOIST_CLIENT_ID", "synthetic-client-id");
    vi.stubEnv("TODOIST_CLIENT_SECRET", "synthetic-client-secret");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({ access_token: "synthetic-new-access", refresh_token: "synthetic-new-refresh" }),
          { status: 200 },
        ),
      ),
    );
    await expect(refreshTodoistCredentials(credentials)).resolves.toMatchObject({
      subjectId: "synthetic-owner",
      accessToken: "synthetic-new-access",
      refreshToken: "synthetic-new-refresh",
    });
  });
});
