import { describe, expect, it, vi } from "vitest";

import {
  API_RATE_LIMIT_BUCKETS,
  API_RATE_LIMIT_FAILURE_POLICY,
  consumeApiRateLimit,
  type ApiRateLimitPort,
  type ApiRateLimitQuota,
} from "@/application/security/api-rate-limit";

const allowedQuota: ApiRateLimitQuota = {
  allowed: true,
  remaining: 4,
  retryAfterSeconds: 0,
};

function portReturning(value: unknown): ApiRateLimitPort {
  return { consume: vi.fn(async () => value as ApiRateLimitQuota) };
}

function portThrowing(): ApiRateLimitPort {
  return {
    consume: vi.fn(async () => {
      throw new Error("relation private.api_rate_limit_counters does not exist");
    }),
  };
}

describe("consumeApiRateLimit", () => {
  it("allows a request while the quota has room", async () => {
    const decision = await consumeApiRateLimit(portReturning(allowedQuota), "mestre-arcano");

    expect(decision).toEqual({ status: "allowed", quota: allowedQuota });
  });

  it("denies a request once the quota is exhausted and keeps the retry hint", async () => {
    const quota: ApiRateLimitQuota = {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 37,
    };

    const decision = await consumeApiRateLimit(
      portReturning(quota),
      "open-source-ai",
    );

    expect(decision).toEqual({ status: "denied", quota });
  });

  it("passes the requested bucket to the adapter", async () => {
    const port = portReturning(allowedQuota);

    await consumeApiRateLimit(port, "feedback");

    expect(port.consume).toHaveBeenCalledWith("feedback");
  });

  it("fails closed for metered AI buckets when the limiter throws", async () => {
    for (const bucket of ["mestre-arcano", "open-source-ai"] as const) {
      const decision = await consumeApiRateLimit(portThrowing(), bucket);

      expect(decision.status, bucket).toBe("unavailable");
    }
  });

  it("fails open for feedback so a limiter outage does not silence students", async () => {
    const decision = await consumeApiRateLimit(portThrowing(), "feedback");

    expect(decision.status).toBe("allowed");
  });

  it("treats a malformed adapter answer like an outage instead of allowing it", async () => {
    for (const malformed of [
      undefined,
      null,
      {},
      { allowed: "yes", remaining: 1, retryAfterSeconds: 0 },
      { allowed: true, remaining: -1, retryAfterSeconds: 0 },
      { allowed: true, remaining: Number.NaN, retryAfterSeconds: 0 },
      { allowed: true, remaining: 1, retryAfterSeconds: "soon" },
    ]) {
      const decision = await consumeApiRateLimit(
        portReturning(malformed),
        "mestre-arcano",
      );

      expect(decision.status, JSON.stringify(malformed)).toBe("unavailable");
    }
  });

  it("accepts an exhausted-but-valid quota with zero remaining", async () => {
    const decision = await consumeApiRateLimit(
      portReturning({ allowed: true, remaining: 0, retryAfterSeconds: 0 }),
      "feedback",
    );

    expect(decision.status).toBe("allowed");
  });

  it("declares a failure policy for every bucket", () => {
    for (const bucket of API_RATE_LIMIT_BUCKETS) {
      expect(["fail-closed", "fail-open"], bucket).toContain(
        API_RATE_LIMIT_FAILURE_POLICY[bucket],
      );
    }
  });

  it("keeps every metered bucket fail-closed", () => {
    expect(API_RATE_LIMIT_FAILURE_POLICY["mestre-arcano"]).toBe("fail-closed");
    expect(API_RATE_LIMIT_FAILURE_POLICY["open-source-ai"]).toBe("fail-closed");
  });
});
