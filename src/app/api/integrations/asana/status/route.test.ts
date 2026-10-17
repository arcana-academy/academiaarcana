import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  jar: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
  cookies: vi.fn(),
  requireUser: vi.fn(),
  decrypt: vi.fn(),
  encrypt: vi.fn(),
  refresh: vi.fn(),
  shouldRefresh: vi.fn(),
  verify: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: mocks.requireUser,
}));
vi.mock("@/infrastructure/integrations/asana", () => {
  class AsanaConnectionError extends Error {
    constructor(message: string, readonly code: string) {
      super(message);
      this.name = "AsanaConnectionError";
    }
  }
  return {
    ASANA_CREDENTIALS_COOKIE: "synthetic-asana-credentials",
    AsanaConnectionError,
    decryptAsanaCredentials: mocks.decrypt,
    encryptAsanaCredentials: mocks.encrypt,
    refreshAsanaCredentials: mocks.refresh,
    shouldRefreshAsanaCredentials: mocks.shouldRefresh,
    verifyAsanaConnection: mocks.verify,
  };
});

import { AsanaConnectionError } from "@/infrastructure/integrations/asana";
import { GET } from "./route";

const credentials = {
  subjectId: "synthetic-owner",
  accessToken: "synthetic-valid-access",
  refreshToken: "synthetic-valid-refresh",
  accessTokenExpiresAt: 1,
};

describe("Asana status verification and temporary service failures", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.cookies.mockResolvedValue(mocks.jar);
    mocks.jar.get.mockReturnValue({ value: "synthetic-credentials-cookie" });
    mocks.requireUser.mockResolvedValue({ sub: "synthetic-owner" });
    mocks.decrypt.mockResolvedValue(credentials);
    mocks.shouldRefresh.mockReturnValue(false);
    mocks.encrypt.mockResolvedValue("synthetic-rotated-cookie");
    mocks.refresh.mockResolvedValue({
      ...credentials,
      accessToken: "synthetic-renewed-access",
    });
    mocks.verify.mockResolvedValue({
      providerId: "asana",
      status: "connected",
      user: { id: "synthetic-user", name: "Synthetic Asana" },
      verifiedAt: "2026-10-10T00:00:00.000Z",
    });
  });

  it.each(["rate_limited", "provider_error", "malformed_response"])(
    "returns 502/request_failed on verification error %s without clearing credentials",
    async (code) => {
      mocks.verify.mockRejectedValueOnce(
        new AsanaConnectionError("synthetic upstream diagnostic", code),
      );
      const response = await GET();
      expect(response.status).toBe(502);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      await expect(response.json()).resolves.toEqual({
        providerId: "asana",
        status: "request_failed",
      });
      expect(mocks.jar.delete).not.toHaveBeenCalled();
      expect(mocks.jar.set).not.toHaveBeenCalled();
    },
  );

  it("returns temporary unavailability on a network exception", async () => {
    mocks.verify.mockRejectedValueOnce(new TypeError("synthetic offline"));
    const response = await GET();
    expect(response.status).toBe(502);
    expect((await response.json()).status).toBe("request_failed");
    expect(mocks.jar.delete).not.toHaveBeenCalled();
  });

  it.each(["reauthorization_required", "insufficient_scope"])(
    "preserves real authorization rejection %s from account verification",
    async (code) => {
      mocks.verify.mockRejectedValueOnce(
        new AsanaConnectionError("synthetic rejected authorization", code),
      );
      const response = await GET();
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      await expect(response.json()).resolves.toEqual({
        providerId: "asana",
        status: "reauthorization_required",
      });
      expect(mocks.jar.delete).not.toHaveBeenCalled();
    },
  );

  it("does not assume revocation on an unverified OAuth refresh failure", async () => {
    mocks.shouldRefresh.mockReturnValueOnce(true);
    mocks.refresh.mockRejectedValueOnce(
      new AsanaConnectionError("synthetic provider outage", "reauthorization_required"),
    );
    const response = await GET();
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      providerId: "asana",
      status: "request_failed",
    });
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(mocks.jar.delete).not.toHaveBeenCalled();
    expect(mocks.jar.set).not.toHaveBeenCalled();
  });

  it("keeps the disconnected state for absent credentials", async () => {
    mocks.decrypt.mockResolvedValueOnce(null);
    const response = await GET();
    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe("disconnected");
    expect(mocks.jar.delete).toHaveBeenCalledWith("synthetic-asana-credentials");
    expect(mocks.verify).not.toHaveBeenCalled();
  });

  it("rejects credentials owned by another authenticated subject", async () => {
    mocks.decrypt.mockResolvedValueOnce({ ...credentials, subjectId: "other-user" });
    const response = await GET();
    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe("disconnected");
    expect(mocks.jar.delete).toHaveBeenCalledTimes(1);
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("returns verified user without exposing access or refresh token", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    const body = JSON.stringify(await response.json());
    expect(body).toContain('"status":"connected"');
    expect(body).toContain("Synthetic Asana");
    expect(body).not.toContain("synthetic-valid-access");
    expect(body).not.toContain("synthetic-valid-refresh");
    expect(mocks.jar.delete).not.toHaveBeenCalled();
  });

  it("rotates the encrypted cookie before verifying a renewed access token", async () => {
    mocks.shouldRefresh.mockReturnValueOnce(true);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(mocks.refresh).toHaveBeenCalledWith(credentials);
    expect(mocks.jar.set).toHaveBeenCalledWith(
      "synthetic-asana-credentials",
      "synthetic-rotated-cookie",
      expect.objectContaining({ httpOnly: true, secure: true, sameSite: "lax" }),
    );
    expect(mocks.verify).toHaveBeenCalledWith("synthetic-renewed-access");
    expect(mocks.jar.delete).not.toHaveBeenCalled();
  });
});
