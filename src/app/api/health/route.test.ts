import { describe, expect, it, vi } from "vitest";

import { GET } from "./route";

describe("GET /api/health", () => {
  it("returns a non-sensitive healthy response", async () => {
    vi.stubEnv("RENDER_GIT_COMMIT", "");

    const response = GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      service: "academiaarcana",
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("reports the deployed Render revision when available", async () => {
    vi.stubEnv("RENDER_GIT_COMMIT", "a44cfed6ebc674d661a9b7504f4d339d41b31239");
    const response = GET();

    await expect(response.json()).resolves.toEqual({
      status: "ok",
      service: "academiaarcana",
      revision: "a44cfed6ebc674d661a9b7504f4d339d41b31239",
    });
  });
});
