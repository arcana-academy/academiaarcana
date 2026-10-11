import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  cookieJar: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
  cookies: vi.fn(),
  requireUser: vi.fn(),
  decrypt: vi.fn(),
  encrypt: vi.fn(),
  shouldRefresh: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: mock.cookies }));
vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: mock.requireUser,
}));
vi.mock("@/infrastructure/integrations/trello", () => {
  class TrelloRefreshError extends Error {
    constructor(readonly httpStatus?: number, readonly oauthError?: "invalid_grant") {
      super("Synthetic OAuth refresh failure");
      this.name = "TrelloRefreshError";
    }
  }
  return {
    TrelloRefreshError,
    TRELLO_CREDENTIALS_COOKIE: "synthetic-trello-credentials",
    decryptTrelloCredentials: mock.decrypt,
    encryptTrelloCredentials: mock.encrypt,
    shouldRefreshTrelloCredentials: mock.shouldRefresh,
    refreshTrelloCredentials: mock.refresh,
  };
});

import { TrelloRefreshError } from "@/infrastructure/integrations/trello";
import { getTrelloCredentialsContext } from "./_lib";

const credentials = {
  subjectId: "synthetic-owner-a",
  accessToken: "synthetic-expired-access",
  refreshToken: "synthetic-valid-refresh",
  accessTokenExpiresAt: 1,
};

describe("Trello credentials: temporary refresh failures", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mock.cookies.mockResolvedValue(mock.cookieJar);
    mock.cookieJar.get.mockReturnValue({ value: "synthetic-encrypted-cookie" });
    mock.requireUser.mockResolvedValue({ sub: "synthetic-owner-a" });
    mock.decrypt.mockResolvedValue(credentials);
    mock.shouldRefresh.mockReturnValue(true);
    mock.encrypt.mockResolvedValue("synthetic-rotated-cookie");
    mock.refresh.mockResolvedValue({
      ...credentials, accessToken: "synthetic-updated-access",
    });
  });

  it.each([429, 500, 503])("preserves the encrypted cookie on HTTP %i", async (status) => {
    mock.refresh.mockRejectedValueOnce(new TrelloRefreshError(status));
    const outcome = await getTrelloCredentialsContext();
    expect(outcome.credentials).toBeNull();
    expect(outcome.status).toBe("request_failed");
    expect(mock.cookieJar.delete).not.toHaveBeenCalled();
    expect(mock.cookieJar.set).not.toHaveBeenCalled();
  });

  it("preserves credentials on network failures", async () => {
    mock.refresh.mockRejectedValueOnce(new TypeError("synthetic network reset"));
    const outcome = await getTrelloCredentialsContext();
    expect(outcome.status).toBe("request_failed");
    expect(mock.cookieJar.delete).not.toHaveBeenCalled();
  });

  it("does not destroy a connection on a generic HTTP 400", async () => {
    mock.refresh.mockRejectedValueOnce(new TrelloRefreshError(400));
    const outcome = await getTrelloCredentialsContext();
    expect(outcome.status).toBe("request_failed");
    expect(mock.cookieJar.delete).not.toHaveBeenCalled();
  });

  it.each([401, 403])("clears rejected refresh tokens for HTTP %i", async (status) => {
    mock.refresh.mockRejectedValueOnce(new TrelloRefreshError(status));
    const outcome = await getTrelloCredentialsContext();
    expect(outcome.status).toBe("reauthorization_required");
    expect(mock.cookieJar.delete).toHaveBeenCalledWith("synthetic-trello-credentials");
    expect(mock.cookieJar.delete).toHaveBeenCalledTimes(1);
  });

  it("clears only an explicitly invalid_grant token", async () => {
    mock.refresh.mockRejectedValueOnce(new TrelloRefreshError(400, "invalid_grant"));
    const outcome = await getTrelloCredentialsContext();
    expect(outcome.status).toBe("reauthorization_required");
    expect(mock.cookieJar.delete).toHaveBeenCalledTimes(1);
  });

  it("rejects another account's cookie without calling the provider", async () => {
    mock.decrypt.mockResolvedValueOnce({ ...credentials, subjectId: "synthetic-owner-b" });
    const outcome = await getTrelloCredentialsContext();
    expect(outcome.status).toBe("disconnected");
    expect(mock.cookieJar.delete).toHaveBeenCalledTimes(1);
    expect(mock.refresh).not.toHaveBeenCalled();
  });

  it("still persists an authorized token rotation for the same account", async () => {
    const outcome = await getTrelloCredentialsContext();
    expect(outcome.status).toBe("connected");
    expect(outcome.credentials).toMatchObject({
      subjectId: "synthetic-owner-a",
      accessToken: "synthetic-updated-access",
    });
    expect(mock.cookieJar.set).toHaveBeenCalledWith(
      "synthetic-trello-credentials",
      "synthetic-rotated-cookie",
      expect.objectContaining({ httpOnly: true, sameSite: "lax" }),
    );
    expect(mock.cookieJar.delete).not.toHaveBeenCalled();
  });
});
