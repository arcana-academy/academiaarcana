import { NextResponse } from "next/server";

import { getIntegrationStatusSnapshot } from "@/infrastructure/integrations/status";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getIntegrationStatusSnapshot();

    return NextResponse.json(snapshot, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    // Runtime/provider failures must not expose internal diagnostics.
    return NextResponse.json(
      { status: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
