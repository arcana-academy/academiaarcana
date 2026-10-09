import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Return a non-sensitive liveness response for the Render health check. */
export function GET() {
  const revision =
    process.env.ACADEMIA_ARCANA_REVISION ||
    process.env.RENDER_GIT_COMMIT ||
    process.env.NEXT_PUBLIC_HONEYBADGER_REVISION;

  return NextResponse.json(
    {
      status: "ok",
      service: "academiaarcana",
      ...(revision ? { revision } : {}),
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
