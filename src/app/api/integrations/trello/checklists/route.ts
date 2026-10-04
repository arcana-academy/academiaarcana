import { NextResponse } from "next/server";

import {
  createTrelloChecklist,
  getTrelloChecklists,
} from "@/infrastructure/integrations/trello";
import { getTrelloCredentialsContext } from "../_lib";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { credentials, status } = await getTrelloCredentialsContext();
  if (!credentials) {
    return NextResponse.json(
      { status },
      { status: status === "reauthorization_required" ? 401 : 200 },
    );
  }

  const cardId = new URL(request.url).searchParams.get("cardId")?.trim();
  if (!cardId) return NextResponse.json({ error: "card_id_required" }, { status: 400 });

  try {
    const result = await getTrelloChecklists(credentials.accessToken, cardId);
    return NextResponse.json(result.output, {
      status: 200,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ status: "trello_request_failed" }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const { credentials, status } = await getTrelloCredentialsContext();
  if (!credentials) {
    return NextResponse.json(
      { error: status },
      { status: status === "reauthorization_required" ? 401 : 409 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { cardId?: string; name?: string }
    | null;
  if (!body?.cardId?.trim() || !body?.name?.trim()) {
    return NextResponse.json({ error: "card_id_and_name_required" }, { status: 400 });
  }

  try {
    const result = await createTrelloChecklist(credentials.accessToken, {
      cardId: body.cardId.trim(),
      name: body.name.trim(),
    });
    return NextResponse.json(result.output, { status: 201 });
  } catch {
    return NextResponse.json({ error: "trello_request_failed" }, { status: 502 });
  }
}
