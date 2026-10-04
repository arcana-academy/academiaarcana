import { NextResponse } from "next/server";

import { verifyTrelloConnection } from "@/infrastructure/integrations/trello";
import { getTrelloCredentialsContext } from "../_lib";

export const dynamic = "force-dynamic";

export async function GET() {
  const { credentials, status } = await getTrelloCredentialsContext();

  if (!credentials) {
    return NextResponse.json(
      { providerId: "trello", status },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const verification = await verifyTrelloConnection(credentials.accessToken);
    return NextResponse.json(
      {
        providerId: verification.providerId,
        status: verification.status,
        user: verification.user,
        verifiedAt: verification.verifiedAt,
      },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { providerId: "trello", status: "reauthorization_required" },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
