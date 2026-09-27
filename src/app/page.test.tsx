import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getClaims, redirect } = vi.hoisted(() => ({
  getClaims: vi.fn(),
  redirect: vi.fn((destination: string): never => {
    throw new Error(`REDIRECT:${destination}`);
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getClaims,
    },
  })),
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

import Page from "./page";

describe("Academia Arcana home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the public entry point for anonymous users", async () => {
    getClaims.mockResolvedValue({
      data: { claims: null },
      error: null,
    });

    const html = renderToStaticMarkup(await Page());

    expect(html).toContain('<h1 id="home-title"');
    expect(html).toContain("Academia Arcana");
    expect(html).toContain('href="/login"');
    expect(html).toContain('href="/cadastro"');
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects authenticated users to the Sanctuary", async () => {
    getClaims.mockResolvedValue({
      data: { claims: { sub: "authenticated-user" } },
      error: null,
    });

    await expect(Page()).rejects.toThrow("REDIRECT:/santuario");
    expect(redirect).toHaveBeenCalledWith("/santuario");
  });

  it("keeps the public entry point available when session lookup fails", async () => {
    getClaims.mockRejectedValue(new Error("session lookup failed"));

    const html = renderToStaticMarkup(await Page());

    expect(html).toContain("Academia Arcana");
    expect(redirect).not.toHaveBeenCalled();
  });
});
