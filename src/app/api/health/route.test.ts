import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const { getPublicRuntimeConfig } = vi.hoisted(() => ({
  getPublicRuntimeConfig: vi.fn(),
}));

vi.mock("@/core/config", () => ({
  getPublicRuntimeConfig,
}));

import { GET } from "./route";

describe("health route", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    getPublicRuntimeConfig.mockReturnValue({
      supabaseUrl: "https://example.supabase.co",
      supabasePublishableKey: "sb_publishable_test_key",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("returns 200 when the Render runtime can reach the Supabase Auth health endpoint", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ name: "GoTrue" }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "ok",
      service: "academiaarcana",
      checks: {
        supabase: "ok",
      },
    });
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      "https://example.supabase.co/auth/v1/health",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          apikey: "sb_publishable_test_key",
        },
        cache: "no-store",
      },
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("returns 503 without leaking Supabase error details when the probe fails", async () => {
    vi.mocked(fetch).mockRejectedValue(
      new Error("sensitive Supabase connection detail"),
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      status: "error",
      service: "academiaarcana",
      checks: {
        supabase: "error",
      },
    });
    expect(JSON.stringify(body)).not.toContain(
      "sensitive Supabase connection detail",
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("returns 503 when Supabase health responds with a non-success status", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, {
        status: 503,
      }),
    );

    const response = await GET();

    expect(response.status).toBe(503);
  });
});
