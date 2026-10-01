import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /api/health", () => {
  it("returns a non-sensitive healthy response", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      service: "academiaarcana",
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
