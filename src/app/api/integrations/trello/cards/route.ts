import { NextResponse } from "next/server";

import {
  createTrelloCard,
  searchTrello,
  updateTrelloCard,
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

  const query = new URL(request.url).searchParams.get("query")?.trim();
  if (!query) return NextResponse.json({ error: "query_required" }, { status: 400 });

  try {
    const result = await searchTrello(credentials.accessToken, query);
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
    | { listId?: string; name?: string; description?: string; due?: string | null }
    | null;

  if (!body?.listId?.trim() || !body?.name?.trim()) {
    return NextResponse.json({ error: "list_id_and_name_required" }, { status: 400 });
  }

  try {
    const result = await createTrelloCard(credentials.accessToken, body);
    return NextResponse.json(result.output, { status: 201 });
  } catch {
    return NextResponse.json({ error: "trello_request_failed" }, { status: 502 });
  }
}

export async function PATCH(request: Request) {
  const { credentials, status } = await getTrelloCredentialsContext();
  if (!credentials) {
    return NextResponse.json(
      { error: status },
      { status: status === "reauthorization_required" ? 401 : 409 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | {
        cardId?: string;
        name?: string;
        description?: string;
        due?: string | null;
        listId?: string;
        closed?: boolean;
      }
    | null;

  if (!body?.cardId?.trim()) {
    return NextResponse.json({ error: "card_id_required" }, { status: 400 });
  }

  try {
    const result = await updateTrelloCard(credentials.accessToken, body.cardId, body);
    return NextResponse.json(result.output, { status: 200 });
  } catch {
    return NextResponse.json({ error: "trello_request_failed" }, { status: 502 });
  }
}
