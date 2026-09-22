import { describe, expect, it, vi } from "vitest";

const { requireAuthenticatedUser, redirect } = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser,
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

import Page from "./page";

describe("Academia Arcana home", () => {
  it("requires authentication and redirects to the sanctuary", async () => {
    requireAuthenticatedUser.mockResolvedValue({ id: "user-id" });

    await expect(Page()).rejects.toThrow("NEXT_REDIRECT");

    expect(requireAuthenticatedUser).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/santuario");
  });
});
