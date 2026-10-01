import { describe, expect, it, vi } from "vitest";

const { getIntegrationStatusSnapshot } = vi.hoisted(() => ({
  getIntegrationStatusSnapshot: vi.fn(),
}));

vi.mock("@/infrastructure/integrations/status", () => ({
  getIntegrationStatusSnapshot,
}));

import { GET } from "./route";

describe("integration status route", () => {
  it("returns the integration catalog status without caching", async () => {
    getIntegrationStatusSnapshot.mockResolvedValue({
      generatedAt: "2026-09-27T00:00:00.000Z",
      catalogSize: 114,
      connectedCount: 1,
      cataloguedCount: 113,
      errorCount: 0,
      serverRuntimeIntegrations: [],
      entries: [
        {
          name: "GitHub",
          source: "chatgpt-catalog",
          status: "connected",
          executionMode: "runtime",
          verification: {
            providerId: "github",
            repository: "arcana-academy/academiaarcana",
            verifiedAt: "2026-09-27T00:00:00.000Z",
          },
        },
      ],
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.connectedCount).toBe(1);
    expect(body.entries[0].status).toBe("connected");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
