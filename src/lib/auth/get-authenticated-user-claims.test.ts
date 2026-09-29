import { beforeEach, describe, expect, it, vi } from "vitest";

const getClaims = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getClaims },
  })),
}));

import { getAuthenticatedUserClaims } from "./get-authenticated-user-claims";

describe("getAuthenticatedUserClaims", () => {
  beforeEach(() => {
    getClaims.mockReset();
  });

  it("returns claims for an authenticated user", async () => {
    getClaims.mockResolvedValue({
      data: { claims: { sub: "user-123" } },
      error: null,
    });

    await expect(getAuthenticatedUserClaims()).resolves.toEqual({
      sub: "user-123",
    });
  });

  it("returns null when authentication fails", async () => {
    getClaims.mockResolvedValue({
      data: null,
      error: new Error("unauthenticated"),
    });

    await expect(getAuthenticatedUserClaims()).resolves.toBeNull();
  });
});
