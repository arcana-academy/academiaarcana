import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Return a non-sensitive liveness response for the Render health check. */
export function GET() {
  return NextResponse.json(
    { status: "ok", service: "academiaarcana" },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
