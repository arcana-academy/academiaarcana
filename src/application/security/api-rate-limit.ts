/**
 * Buckets with a durable, per-user quota. Each name matches a policy row in
 * `private.api_rate_limit_policies`; the database owns the numbers, so the
 * application and any direct RPC caller are limited identically.
 */
export const API_RATE_LIMIT_BUCKETS = [
  "mestre-arcano",
  "open-source-ai",
  "feedback",
] as const;

export type ApiRateLimitBucket = (typeof API_RATE_LIMIT_BUCKETS)[number];

export type ApiRateLimitQuota = {
  readonly allowed: boolean;
  /** Requests still available in the current window. Always >= 0. */
  readonly remaining: number;
  /** Seconds until the current window resets; 0 while the request is allowed. */
  readonly retryAfterSeconds: number;
};

export type ApiRateLimitDecision =
  | { readonly status: "allowed"; readonly quota: ApiRateLimitQuota }
  | { readonly status: "denied"; readonly quota: ApiRateLimitQuota }
  /** The limiter could not answer (database unavailable or contract drift). */
  | { readonly status: "unavailable" };

/** Port implemented by the infrastructure adapter. */
export interface ApiRateLimitPort {
  consume(bucket: ApiRateLimitBucket): Promise<ApiRateLimitQuota>;
}

/**
 * How a surface reacts when the limiter is unavailable.
 *
 * - `fail-closed`: refuse the request. Used by the metered AI surfaces, where a
 *   request that cannot be bounded can spend real money.
 * - `fail-open`: proceed. Used by feedback, where refusing a student because the
 *   limiter is down costs more than an unbounded cheap insert.
 */
export type ApiRateLimitFailurePolicy = "fail-closed" | "fail-open";

export const API_RATE_LIMIT_FAILURE_POLICY: Record<
  ApiRateLimitBucket,
  ApiRateLimitFailurePolicy
> = {
  "mestre-arcano": "fail-closed",
  "open-source-ai": "fail-closed",
  feedback: "fail-open",
};

function isQuota(value: unknown): value is ApiRateLimitQuota {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Partial<ApiRateLimitQuota>;

  return (
    typeof candidate.allowed === "boolean" &&
    typeof candidate.remaining === "number" &&
    Number.isFinite(candidate.remaining) &&
    candidate.remaining >= 0 &&
    typeof candidate.retryAfterSeconds === "number" &&
    Number.isFinite(candidate.retryAfterSeconds) &&
    candidate.retryAfterSeconds >= 0
  );
}

/**
 * Consumes one request from `bucket` and decides whether the caller may proceed.
 *
 * A malformed adapter answer is treated exactly like an outage: the bucket's
 * failure policy decides, never a silently "allowed" default.
 */
export async function consumeApiRateLimit(
  port: ApiRateLimitPort,
  bucket: ApiRateLimitBucket,
): Promise<ApiRateLimitDecision> {
  let quota: unknown;

  try {
    quota = await port.consume(bucket);
  } catch {
    return resolveUnavailable(bucket);
  }

  if (!isQuota(quota)) {
    return resolveUnavailable(bucket);
  }

  return quota.allowed
    ? { status: "allowed", quota }
    : { status: "denied", quota };
}

function resolveUnavailable(
  bucket: ApiRateLimitBucket,
): ApiRateLimitDecision {
  return API_RATE_LIMIT_FAILURE_POLICY[bucket] === "fail-open"
    ? { status: "allowed", quota: { allowed: true, remaining: 0, retryAfterSeconds: 0 } }
    : { status: "unavailable" };
}
