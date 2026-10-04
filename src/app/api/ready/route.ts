import { NextResponse } from "next/server";

import { getPublicRuntimeConfig } from "@/core/config";

export const dynamic = "force-dynamic";

const SUPABASE_HEALTH_PATH = "/auth/v1/health";
const READY_TIMEOUT_MS = 5_000;

/** Creates a cache-free JSON response for the readiness contract. */
const jsonResponse = (body: object, status: number) => NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });

/** Checks application readiness against the canonical Supabase service. */
export async function GET() {
  try {
    const { supabaseUrl, supabasePublishableKey } = getPublicRuntimeConfig();
    const healthUrl = new URL(SUPABASE_HEALTH_PATH, supabaseUrl).toString();

    const response = await fetch(healthUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        apikey: supabasePublishableKey,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(READY_TIMEOUT_MS),
    });

    if (!response.ok) {
      return jsonResponse(
        {
          status: "error",
          service: "academiaarcana",
          checks: {
            supabase: "error",
          },
        },
        503,
      );
    }

    return jsonResponse(
      {
        status: "ok",
        service: "academiaarcana",
        checks: {
          supabase: "ok",
        },
      },
      200,
    );
  } catch {
    return jsonResponse(
      {
        status: "error",
        service: "academiaarcana",
        checks: {
          supabase: "error",
        },
      },
      503,
    );
  }
}
