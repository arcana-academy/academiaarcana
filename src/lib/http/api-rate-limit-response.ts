import { NextResponse } from "next/server";

import type { ApiRateLimitDecision } from "@/application/security/api-rate-limit";

const DENIED_MESSAGE =
  "Você atingiu o limite de uso desta funcionalidade. Tente novamente em instantes.";
const UNAVAILABLE_MESSAGE =
  "Não foi possível validar o limite de uso agora. Tente novamente em instantes.";

/** Header that tells well-behaved clients when to retry. */
export const RETRY_AFTER_HEADER = "Retry-After";

/**
 * Turns a limiter decision into the response the route must return, or `null`
 * when the request may continue.
 *
 * The messages are deliberately generic: they never disclose the bucket, the
 * quota, the caller identity or any internal identifier.
 */
export function apiRateLimitResponse(
  decision: ApiRateLimitDecision,
): NextResponse | null {
  if (decision.status === "allowed") {
    return null;
  }

  if (decision.status === "denied") {
    const retryAfterSeconds = Math.max(
      Math.ceil(decision.quota.retryAfterSeconds),
      1,
    );

    return NextResponse.json(
      { error: DENIED_MESSAGE },
      {
        status: 429,
        headers: {
          [RETRY_AFTER_HEADER]: String(retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  // `unavailable` only exists for buckets whose failure policy is fail-closed:
  // the surface refuses to run an unbounded request it cannot meter.
  return NextResponse.json(
    { error: UNAVAILABLE_MESSAGE },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
