import { NextResponse } from "next/server";

import {
  addTrelloChecklistItem,
  updateTrelloChecklistItem,
} from "@/infrastructure/integrations/trello";
import { getTrelloCredentialsContext } from "../../_lib";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { credentials, status } = await getTrelloCredentialsContext();
  if (!credentials) {
    return NextResponse.json(
      { error: status },
      { status: status === "reauthorization_required" ? 401 : 409 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { checklistId?: string; name?: string; checked?: boolean }
    | null;
  if (!body?.checklistId?.trim() || !body?.name?.trim()) {
    return NextResponse.json({ error: "checklist_id_and_name_required" }, { status: 400 });
  }

  try {
    const result = await addTrelloChecklistItem(credentials.accessToken, {
      checklistId: body.checklistId.trim(),
      name: body.name.trim(),
      checked: body.checked,
    });
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
    | { cardId?: string; itemId?: string; checked?: boolean; name?: string }
    | null;
  const cardId = body?.cardId?.trim();
  const itemId = body?.itemId?.trim();
  if (!cardId || !itemId) {
    return NextResponse.json({ error: "card_id_and_item_id_required" }, { status: 400 });
  }

  try {
    const result = await updateTrelloChecklistItem(credentials.accessToken, {
      ...body,
      cardId,
      itemId,
    });
    return NextResponse.json(result.output, { status: 200 });
  } catch {
    return NextResponse.json({ error: "trello_request_failed" }, { status: 502 });
  }
}
