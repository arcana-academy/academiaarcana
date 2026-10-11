import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ASANA_OAUTH_TOKEN_URL,
  refreshAsanaCredentials,
} from "./asana";

const startingCredentials = {
  subjectId: "synthetic-owner",
  accessToken: "synthetic-old-access",
  refreshToken: "synthetic-original-refresh",
  accessTokenExpiresAt: 1,
};

function mockRefreshResponse(
  input: { access_token: string; refresh_token?: string; expires_in?: number },
) {
  return new Response(JSON.stringify(input), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Asana long-lived refresh token preservation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("keeps the original refresh token when the provider rotates only access_token", async () => {
    vi.stubEnv("ASANA_CLIENT_ID", "synthetic-client-id");
    vi.stubEnv("ASANA_CLIENT_SECRET", "synthetic-client-secret");
    const fetchMock = vi.fn(async () =>
      mockRefreshResponse({ access_token: "synthetic-new-access", expires_in: 3600 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await refreshAsanaCredentials(startingCredentials);

    expect(result).toMatchObject({
      subjectId: "synthetic-owner",
      accessToken: "synthetic-new-access",
      refreshToken: "synthetic-original-refresh",
    });
    expect(result.accessTokenExpiresAt).toBeGreaterThan(Date.now());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      ASANA_OAUTH_TOKEN_URL,
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        body: expect.any(URLSearchParams),
      }),
    );
    const request = (fetchMock.mock.calls as unknown as Array<[string, RequestInit]>)[0]?.[1];
    const body = request?.body as URLSearchParams;
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe("synthetic-original-refresh");
    expect(JSON.stringify(result)).not.toContain("synthetic-client-secret");
    expect(startingCredentials.refreshToken).toBe("synthetic-original-refresh");
  });

  it("persists a replacement refresh token when the provider explicitly rotates it", async () => {
    vi.stubEnv("ASANA_CLIENT_ID", "synthetic-client-id");
    vi.stubEnv("ASANA_CLIENT_SECRET", "synthetic-client-secret");
    vi.stubGlobal("fetch", vi.fn(async () =>
      mockRefreshResponse({
        access_token: "synthetic-rotated-access",
        refresh_token: "synthetic-rotated-refresh",
        expires_in: 3600,
      }),
    ));

    const result = await refreshAsanaCredentials(startingCredentials);
    expect(result).toMatchObject({
      subjectId: "synthetic-owner",
      accessToken: "synthetic-rotated-access",
      refreshToken: "synthetic-rotated-refresh",
    });
  });

  it("supports consecutive refreshes without losing the original long-lived credential", async () => {
    vi.stubEnv("ASANA_CLIENT_ID", "synthetic-client-id");
    vi.stubEnv("ASANA_CLIENT_SECRET", "synthetic-client-secret");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(mockRefreshResponse({
        access_token: "synthetic-access-2",
        expires_in: 3600,
      }))
      .mockResolvedValueOnce(mockRefreshResponse({
        access_token: "synthetic-access-3",
        expires_in: 3600,
      }));
    vi.stubGlobal("fetch", fetchMock);

    const first = await refreshAsanaCredentials(startingCredentials);
    const second = await refreshAsanaCredentials(first);

    expect(first.refreshToken).toBe("synthetic-original-refresh");
    expect(second).toMatchObject({
      subjectId: "synthetic-owner",
      accessToken: "synthetic-access-3",
      refreshToken: "synthetic-original-refresh",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondInit = fetchMock.mock.calls[1]?.[1] as RequestInit | undefined;
    expect((secondInit?.body as URLSearchParams).get("refresh_token"))
      .toBe("synthetic-original-refresh");
  });

  it("rejects a malformed refresh response instead of persisting credentials without access", async () => {
    vi.stubEnv("ASANA_CLIENT_ID", "synthetic-client-id");
    vi.stubEnv("ASANA_CLIENT_SECRET", "synthetic-client-secret");
    vi.stubGlobal("fetch", vi.fn(async () =>
      mockRefreshResponse({ access_token: "" }),
    ));

    await expect(refreshAsanaCredentials(startingCredentials)).rejects.toMatchObject({
      name: "AsanaConnectionError",
      code: "authorization_failed",
    });
    expect(startingCredentials.refreshToken).toBe("synthetic-original-refresh");
  });
});
