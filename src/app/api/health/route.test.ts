import { describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/infrastructure/supabase/server", () => ({
  createSupabaseServerClient,
}));

import { GET } from "./route";

function createSupabaseQuery(result: { error: unknown }) {
  const limit = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ select });

  return { from };
}

describe("health route", () => {
  it("returns 200 when the Render runtime can reach the Supabase schema", async () => {
    createSupabaseServerClient.mockResolvedValue(
      createSupabaseQuery({ error: null }),
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
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("returns 503 without leaking Supabase error details when the probe fails", async () => {
    createSupabaseServerClient.mockResolvedValue(
      createSupabaseQuery({
        error: {
          message: "sensitive database detail",
          code: "42501",
        },
      }),
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
    expect(JSON.stringify(body)).not.toContain("sensitive database detail");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
