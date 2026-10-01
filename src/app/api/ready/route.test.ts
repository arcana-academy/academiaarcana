import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

describe("GET /api/ready", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    vi.restoreAllMocks();
  });

  it("returns readiness when the canonical Supabase service is healthy", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.example";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-runtime-value";

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      service: "academiaarcana",
      checks: {
        supabase: "ok",
      },
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://project.example/auth/v1/health",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          apikey: "test-runtime-value",
        },
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("fails closed when Supabase readiness is unavailable", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.example";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-runtime-value";

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 503 }),
    );

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      status: "error",
      service: "academiaarcana",
      checks: {
        supabase: "error",
      },
    });
  });

  it("fails closed when runtime configuration is missing", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      status: "error",
      service: "academiaarcana",
      checks: {
        supabase: "error",
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
