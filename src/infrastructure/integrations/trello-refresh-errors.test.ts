import { afterEach, describe, expect, it, vi } from "vitest";
import { refreshTrelloCredentials, TrelloRefreshError } from "./trello";

const credentials = {
  subjectId: "synthetic-owner-a",
  accessToken: "synthetic-old-access",
  refreshToken: "synthetic-refresh",
  accessTokenExpiresAt: 1,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function providerRequest(response: Response) {
  vi.stubEnv("TRELLO_CLIENT_ID", "synthetic-client-id");
  vi.stubEnv("TRELLO_CLIENT_SECRET", "synthetic-client-secret");
  vi.stubGlobal("fetch", vi.fn(async () => response));
}

describe("Trello refresh error provenance", () => {
  it.each([401, 403, 429, 503])("retains upstream HTTP %i without leaking a response body", async (status) => {
    providerRequest(new Response(
      JSON.stringify({ error: "synthetic-private-diagnostic" }),
      { status, headers: { "Content-Type": "application/json" } },
    ));
    let error: unknown;
    try {
      await refreshTrelloCredentials(credentials);
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(TrelloRefreshError);
    expect(error).toMatchObject({ httpStatus: status, oauthError: undefined });
    expect((error as Error).message).not.toContain("synthetic-private-diagnostic");
  });

  it("recognizes a proven invalid_grant on HTTP 400", async () => {
    providerRequest(new Response(
      JSON.stringify({ error: "invalid_grant" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    ));
    await expect(refreshTrelloCredentials(credentials)).rejects.toMatchObject({
      name: "TrelloRefreshError", httpStatus: 400, oauthError: "invalid_grant",
    });
  });

  it("does not treat other HTTP 400 errors as invalid_grant", async () => {
    providerRequest(new Response(
      JSON.stringify({ error: "invalid_client" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    ));
    await expect(refreshTrelloCredentials(credentials)).rejects.toMatchObject({
      httpStatus: 400, oauthError: undefined,
    });
  });

  it("preserves the owner and existing refresh token after successful renewal", async () => {
    providerRequest(new Response(JSON.stringify({
      access_token: "synthetic-access-updated",
      expires_in: 3600,
    }), { status: 200 }));
    await expect(refreshTrelloCredentials(credentials)).resolves.toMatchObject({
      subjectId: "synthetic-owner-a",
      accessToken: "synthetic-access-updated",
      refreshToken: "synthetic-refresh",
    });
  });
});
