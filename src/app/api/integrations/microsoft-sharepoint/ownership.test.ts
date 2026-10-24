import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCookies,
  mockRequireAuthenticatedUser,
  mockDecrypt,
  mockGetValid,
  mockVerify,
  mockCreateClient,
} = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  mockRequireAuthenticatedUser: vi.fn(),
  mockDecrypt: vi.fn(),
  mockGetValid: vi.fn(),
  mockVerify: vi.fn(),
  mockCreateClient: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: mockRequireAuthenticatedUser,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/infrastructure/integrations/microsoft-sharepoint", () => ({
  MICROSOFT_SHAREPOINT_CREDENTIALS_COOKIE: "test-sharepoint-credentials",
  decryptMicrosoftSharePointCredentials: mockDecrypt,
  getValidMicrosoftSharePointCredentials: mockGetValid,
  verifyMicrosoftSharePointConnection: mockVerify,
  encryptMicrosoftSharePointCredentials: vi.fn(),
}));

import { GET as getStatus } from "./status/route";
import { GET as getSources } from "./sources/route";

const credentials = {
  subjectId: "student-a",
  accessToken: "synthetic-token-a",
  refreshToken: null,
};

describe("Microsoft SharePoint subject ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue({ sub: "student-a" });
    mockCookies.mockResolvedValue({
      get: vi.fn(() => ({ value: "synthetic-encrypted-cookie" })),
      set: vi.fn(),
    });
    mockDecrypt.mockResolvedValue(credentials);
    mockGetValid.mockResolvedValue(credentials);
    mockVerify.mockResolvedValue({
      status: "connected",
      providerId: "microsoft-sharepoint",
      verifiedAt: "2026-10-10T12:00:00.000Z",
    });
  });

  it("recognizes credentials tied to the authenticated JWT subject", async () => {
    const response = await getStatus();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "connected",
      providerId: "microsoft-sharepoint",
    });
    expect(mockGetValid).toHaveBeenCalledWith(credentials);
    expect(mockVerify).toHaveBeenCalledWith(credentials.accessToken);
  });

  it("does not accept credentials issued for another JWT subject", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({ sub: "student-b" });
    const response = await getStatus();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "disconnected" });
    expect(mockGetValid).not.toHaveBeenCalled();
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it("scopes the saved document source query to the JWT subject", async () => {
    const ownerFilter = vi.fn(() => ({
      order: () => ({
        limit: async () => ({ data: [], error: null }),
      }),
    }));
    mockCreateClient.mockResolvedValue({
      from: () => ({
        select: () => ({ eq: ownerFilter }),
      }),
    });

    const response = await getSources();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ sources: [] });
    expect(ownerFilter).toHaveBeenCalledWith("owner_id", "student-a");
  });

  it("prevents user.id regressions across the seven JWT-claim routes", () => {
    const routes = [
      "sites/route.ts",
      "status/route.ts",
      "drives/route.ts",
      "search/route.ts",
      "sources/route.ts",
      "context/route.ts",
      "sources/[sourceId]/content/route.ts",
    ];

    for (const route of routes) {
      const source = readFileSync(
        join(
          process.cwd(),
          "src/app/api/integrations/microsoft-sharepoint",
          route,
        ),
        "utf8",
      );

      expect(source, route).not.toMatch(/\buser\.id\b/);
      expect(source, route).toMatch(/\buser\.sub\b/);
    }
  });
});
