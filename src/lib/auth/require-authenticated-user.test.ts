import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn();
const getClaims = vi.fn();

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims },
  }),
}));

import { requireAuthenticatedUser } from "./require-authenticated-user";

describe("requireAuthenticatedUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns verified claims when a subject is present", async () => {
    const claims = { sub: "subject-123", role: "authenticated" };
    getClaims.mockResolvedValue({ data: { claims }, error: null });

    await expect(requireAuthenticatedUser()).resolves.toEqual(claims);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated requests to login", async () => {
    getClaims.mockResolvedValue({ data: { claims: null }, error: null });

    await requireAuthenticatedUser();

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects when claims validation fails", async () => {
    getClaims.mockResolvedValue({ data: { claims: null }, error: new Error("expired") });

    await requireAuthenticatedUser();

    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
