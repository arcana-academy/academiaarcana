import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCookies,
  mockRequireAuthenticatedUser,
  mockDecrypt,
  mockShouldRefresh,
  mockRefresh,
  mockEncrypt,
} = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  mockRequireAuthenticatedUser: vi.fn(),
  mockDecrypt: vi.fn(),
  mockShouldRefresh: vi.fn(),
  mockRefresh: vi.fn(),
  mockEncrypt: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: mockCookies }));
vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: mockRequireAuthenticatedUser,
}));
vi.mock("@/infrastructure/integrations/asana", () => ({
  ASANA_CREDENTIALS_COOKIE: "__Host-aa-asana-credentials",
  AsanaConnectionError: class AsanaConnectionError extends Error {
    constructor(message: string, readonly code: string) { super(message); this.name = "AsanaConnectionError"; }
  },
  decryptAsanaCredentials: mockDecrypt,
  shouldRefreshAsanaCredentials: mockShouldRefresh,
  refreshAsanaCredentials: mockRefresh,
  encryptAsanaCredentials: mockEncrypt,
}));

import { getAsanaCredentialsContext } from "./_lib";

const current = {
  subjectId: "synthetic-user-1",
  accessToken: "synthetic-expiring-access",
  refreshToken: "synthetic-refresh",
  accessTokenExpiresAt: 1000,
};
const renewed = {
  ...current,
  accessToken: "synthetic-rotated-access",
  refreshToken: "synthetic-rotated-refresh",
  accessTokenExpiresAt: 200000,
};

describe("Asana subject-bound credentials and refresh", () => {
  const jar = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };

  beforeEach(() => {
    vi.resetAllMocks();
    mockCookies.mockResolvedValue(jar);
    mockRequireAuthenticatedUser.mockResolvedValue({ sub: current.subjectId });
    jar.get.mockReturnValue({ value: "synthetic-encrypted-cookie" });
    mockDecrypt.mockResolvedValue(current);
    mockShouldRefresh.mockReturnValue(false);
    mockRefresh.mockResolvedValue(renewed);
    mockEncrypt.mockResolvedValue("synthetic-rotated-cookie");
  });

  it("returns active credentials without unnecessary token renewal", async () => {
    const context = await getAsanaCredentialsContext();
    expect(context).toEqual({ credentials: current, status: "connected" });
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(jar.set).not.toHaveBeenCalled();
  });

  it("renews expiring credentials, persists the rotated cookie and returns the new access token", async () => {
    mockShouldRefresh.mockReturnValueOnce(true);
    const context = await getAsanaCredentialsContext();
    expect(context).toEqual({ credentials: renewed, status: "connected" });
    expect(mockRefresh).toHaveBeenCalledOnce();
    expect(mockRefresh).toHaveBeenCalledWith(current);
    expect(mockEncrypt).toHaveBeenCalledOnce();
    expect(mockEncrypt).toHaveBeenCalledWith(renewed);
    expect(jar.set).toHaveBeenCalledWith(
      "__Host-aa-asana-credentials",
      "synthetic-rotated-cookie",
      {
        httpOnly: true,
        maxAge: 365 * 24 * 60 * 60,
        path: "/",
        sameSite: "lax",
        secure: true,
      },
    );
  });

  it("never exposes another user's credentials or refreshes them", async () => {
    mockRequireAuthenticatedUser.mockResolvedValueOnce({ sub: "synthetic-other-user" });
    const context = await getAsanaCredentialsContext();
    expect(context).toEqual({ credentials: null, status: "disconnected" });
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(jar.delete).toHaveBeenCalledWith("__Host-aa-asana-credentials");
  });

  it("returns disconnected when there is no decryptable connection", async () => {
    mockDecrypt.mockResolvedValueOnce(null);
    const context = await getAsanaCredentialsContext();
    expect(context).toEqual({ credentials: null, status: "disconnected" });
    expect(mockShouldRefresh).not.toHaveBeenCalled();
  });

  it("fails closed and removes the cookie when refreshing is rejected", async () => {
    mockShouldRefresh.mockReturnValueOnce(true);
    mockRefresh.mockRejectedValueOnce(new Error("synthetic refresh rejection"));
    const context = await getAsanaCredentialsContext();
    expect(context).toEqual({ credentials: null, status: "reauthorization_required" });
    expect(jar.delete).toHaveBeenCalledWith("__Host-aa-asana-credentials");
    expect(jar.set).not.toHaveBeenCalled();
  });

  it.each(["rate_limited", "request_failed"])(
    "keeps the cookie and marks %s as retryable after token refresh",
    async code => {
      mockShouldRefresh.mockReturnValueOnce(true);
      const { AsanaConnectionError } = await import("@/infrastructure/integrations/asana");
      mockRefresh.mockRejectedValueOnce(new AsanaConnectionError("synthetic temporary error", code));
      const context = await getAsanaCredentialsContext();
      expect(context).toEqual({ credentials: null, status: "request_failed" });
      expect(jar.delete).not.toHaveBeenCalled();
      expect(jar.set).not.toHaveBeenCalled();
    },
  );

  it("retains subject-bound cookie when a successful refresh response contains invalid JSON", async () => {
    mockShouldRefresh.mockReturnValueOnce(true);
    mockRefresh.mockRejectedValueOnce(new SyntaxError("synthetic HTTP 200 invalid JSON"));
    const context = await getAsanaCredentialsContext();
    expect(context).toEqual({ credentials: null, status: "request_failed" });
    expect(jar.delete).not.toHaveBeenCalled();
    expect(jar.set).not.toHaveBeenCalled();
  });

  it("rejects a rotated credential claiming a different owner", async () => {
    mockShouldRefresh.mockReturnValueOnce(true);
    mockRefresh.mockResolvedValueOnce({ ...renewed, subjectId: "synthetic-other-user" });
    const context = await getAsanaCredentialsContext();
    expect(context).toEqual({ credentials: null, status: "reauthorization_required" });
    expect(jar.delete).toHaveBeenCalledWith("__Host-aa-asana-credentials");
    expect(jar.set).not.toHaveBeenCalled();
  });
});
