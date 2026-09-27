import { describe, expect, it, vi } from "vitest";

import { GET } from "./route";

describe("GitHub verification route", () => {
  it("returns a verifiable connected result", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          full_name: "arcana-academy/academiaarcana",
          default_branch: "main",
          visibility: "public",
          private: false,
          html_url:
            "https://github.com/arcana-academy/academiaarcana",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    try {
      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.providerId).toBe("github");
      expect(body.pluginName).toBe("GitHub");
      expect(body.status).toBe("connected");
      expect(body.repository.fullName).toBe(
        "arcana-academy/academiaarcana",
      );
      expect(response.headers.get("cache-control")).toBe("no-store");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("returns a gateway error when GitHub is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    try {
      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(502);
      expect(body.providerId).toBe("github");
      expect(body.pluginName).toBe("GitHub");
      expect(body.status).toBe("error");
      expect(body.message).toBe(
        "GitHub connection verification failed.",
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
