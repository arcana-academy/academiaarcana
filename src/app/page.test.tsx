import { beforeEach, describe, expect, it, vi } from "vitest";

import Page from "./page";

const getClaims = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getClaims,
    },
  })),
}));

const redirect = vi.fn((destination: string): never => {
  throw new Error(`REDIRECT:${destination}`);
});

vi.mock("next/navigation", () => ({
  redirect,
}));

describe("Academia Arcana home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the public entry point for anonymous users", async () => {
    getClaims.mockResolvedValue({
      data: { claims: null },
      error: null,
    });

    const page = await Page();

    const { renderToStaticMarkup } = await import("react-dom/server");
    const html = renderToStaticMarkup(page);

    expect(html).toContain('<h1 id="home-title">');
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
    getClaims.mockResolvedValue({
      data: { claims: null },
      error: new Error("session lookup failed"),
    });

    const page = await Page();
    expect(page).toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });
});
