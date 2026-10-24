import { describe, expect, it } from "vitest";

import {
  RETRY_AFTER_HEADER,
  apiRateLimitResponse,
} from "@/lib/http/api-rate-limit-response";

describe("apiRateLimitResponse", () => {
  it("lets an allowed request continue", () => {
    expect(
      apiRateLimitResponse({
        status: "allowed",
        quota: { allowed: true, remaining: 3, retryAfterSeconds: 0 },
      }),
    ).toBeNull();
  });

  it("answers 429 with a whole-second Retry-After header", async () => {
    const response = apiRateLimitResponse({
      status: "denied",
      quota: { allowed: false, remaining: 0, retryAfterSeconds: 4.2 },
    });

    expect(response?.status).toBe(429);
    expect(response?.headers.get(RETRY_AFTER_HEADER)).toBe("5");
    expect(response?.headers.get("Cache-Control")).toBe("no-store");
    await expect(response?.json()).resolves.toEqual({
      error: expect.stringContaining("limite"),
    });
  });

  it("never sends a Retry-After below one second", async () => {
    const response = apiRateLimitResponse({
      status: "denied",
      quota: { allowed: false, remaining: 0, retryAfterSeconds: 0 },
    });

    expect(response?.headers.get(RETRY_AFTER_HEADER)).toBe("1");
  });

  it("answers 503 when a fail-closed bucket cannot be metered", async () => {
    const response = apiRateLimitResponse({ status: "unavailable" });

    expect(response?.status).toBe(503);
    expect(response?.headers.get(RETRY_AFTER_HEADER)).toBeNull();
    await expect(response?.json()).resolves.toEqual({
      error: expect.stringContaining("Não foi possível"),
    });
  });

  it("does not leak the bucket, the quota or any internal identifier", async () => {
    const denied = await apiRateLimitResponse({
      status: "denied",
      quota: { allowed: false, remaining: 0, retryAfterSeconds: 9 },
    })?.json();
    const unavailable = await apiRateLimitResponse({
      status: "unavailable",
    })?.json();

    for (const body of [denied, unavailable]) {
      const text = JSON.stringify(body);

      expect(text).not.toMatch(/mestre-arcano|open-source-ai|feedback/);
      expect(text).not.toMatch(/consume_api_rate_limit|private\.|relation|sql/i);
      expect(text).not.toMatch(/user|owner|uuid/i);
    }
  });
});
