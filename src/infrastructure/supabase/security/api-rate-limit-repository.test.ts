import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { SupabaseApiRateLimitRepository } from "@/infrastructure/supabase/security/api-rate-limit-repository";

function clientReturning(result: unknown) {
  const rpc = vi.fn(async () => result);

  return { client: { rpc } as unknown as SupabaseClient, rpc };
}

describe("SupabaseApiRateLimitRepository", () => {
  it("calls the security-definer RPC with the bucket name only", async () => {
    const { client, rpc } = clientReturning({
      data: [{ allowed: true, remaining: 9, retry_after_seconds: 0 }],
      error: null,
    });

    await new SupabaseApiRateLimitRepository(client).consume("mestre-arcano");

    // No subject and no limit travel from the application: the database derives
    // both, so a caller cannot raise its own quota.
    expect(rpc).toHaveBeenCalledWith("consume_api_rate_limit", {
      p_bucket: "mestre-arcano",
    });
  });

  it("maps the database row to the quota contract", async () => {
    const { client } = clientReturning({
      data: [{ allowed: false, remaining: 0, retry_after_seconds: 12 }],
      error: null,
    });

    await expect(
      new SupabaseApiRateLimitRepository(client).consume("mestre-arcano"),
    ).resolves.toEqual({ allowed: false, remaining: 0, retryAfterSeconds: 12 });
  });

  it("clamps a negative remaining value to zero instead of exposing it", async () => {
    const { client } = clientReturning({
      data: [{ allowed: false, remaining: -3, retry_after_seconds: -1 }],
      error: null,
    });

    await expect(
      new SupabaseApiRateLimitRepository(client).consume("feedback"),
    ).resolves.toEqual({ allowed: false, remaining: 0, retryAfterSeconds: 0 });
  });

  it("throws when the RPC reports an error", async () => {
    const { client } = clientReturning({
      data: null,
      error: { message: "permission denied for function consume_api_rate_limit" },
    });

    await expect(
      new SupabaseApiRateLimitRepository(client).consume("mestre-arcano"),
    ).rejects.toThrow(/permission denied/);
  });

  it("throws on an empty or malformed payload instead of assuming allowed", async () => {
    for (const payload of [[], null, [{}], [{ allowed: true }]]) {
      const { client } = clientReturning({ data: payload, error: null });

      await expect(
        new SupabaseApiRateLimitRepository(client).consume("mestre-arcano"),
        JSON.stringify(payload),
      ).rejects.toThrow(/Resposta inválida/);
    }
  });
});
