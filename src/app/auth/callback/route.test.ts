import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const exchangeCodeForSession = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { exchangeCodeForSession },
  }),
}));

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exchangeCodeForSession.mockResolvedValue({ error: null });
  });

  it.each(["//evil.example", "/\\evil.example", "/\\/evil.example"])(
    "redirects external next value %s to the application root",
    async (next) => {
      const response = await GET(
        new Request(
          `https://app.example/auth/callback?code=valid-code&next=${encodeURIComponent(next)}`,
        ),
      );

      expect(response.headers.get("location")).toBe("https://app.example/");
    },
  );

  it("preserves a valid internal path, query string, and fragment", async () => {
    const response = await GET(
      new Request(
        "https://app.example/auth/callback?code=valid-code&next=%2Fworkspace%3Fview%3Dtree%23current",
      ),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("valid-code");
    expect(response.headers.get("location")).toBe(
      "https://app.example/workspace?view=tree#current",
    );
  });

  it("redirects to the login page when the authorization code is missing", async () => {
    const response = await GET(new Request("https://app.example/auth/callback"));

    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://app.example/login?error=auth",
    );
  });

  it("redirects to the login page when the code exchange fails", async () => {
    exchangeCodeForSession.mockResolvedValueOnce({
      error: new Error("Invalid authorization code"),
    });

    const response = await GET(
      new Request("https://app.example/auth/callback?code=invalid-code"),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("invalid-code");
    expect(response.headers.get("location")).toBe(
      "https://app.example/login?error=auth",
    );
  });
});
