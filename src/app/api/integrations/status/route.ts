import { NextResponse } from "next/server";

import { getIntegrationStatusSnapshot } from "@/infrastructure/integrations/status";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getIntegrationStatusSnapshot();

  return NextResponse.json(snapshot, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
