import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  getClaims: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: mocks.getClaims },
  }),
}));

import { requireAuthenticatedUser } from "./require-authenticated-user";

describe("requireAuthenticatedUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns verified claims when a subject is present", async () => {
    const claims = { sub: "subject-123", role: "authenticated" };
    mocks.getClaims.mockResolvedValue({ data: { claims }, error: null });

    await expect(requireAuthenticatedUser()).resolves.toEqual(claims);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated requests to login", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: null }, error: null });

    await requireAuthenticatedUser();

    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects when claims validation fails", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: null }, error: new Error("expired") });

    await requireAuthenticatedUser();

    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });
});
