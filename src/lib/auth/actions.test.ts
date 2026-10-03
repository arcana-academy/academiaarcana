import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signOut: vi.fn(),
  redirect: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { signOut } from "./actions";

describe("signOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockResolvedValue({
      auth: {
        signOut: mocks.signOut,
      },
    });
    mocks.signOut.mockResolvedValue({ error: null });
  });

  it("revokes the server-side session and redirects to login", async () => {
    await signOut();

    expect(mocks.signOut).toHaveBeenCalledTimes(1);
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("does not redirect when session revocation fails", async () => {
    const error = new Error("revocation failed");
    mocks.signOut.mockRejectedValueOnce(error);

    await expect(signOut()).rejects.toBe(error);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
