import { NextResponse } from "next/server";

import { createTrelloList } from "@/infrastructure/integrations/trello";
import { getTrelloCredentialsContext } from "../_lib";

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
    | { boardId?: string; name?: string }
    | null;
  if (!body?.boardId?.trim() || !body?.name?.trim()) {
    return NextResponse.json({ error: "board_id_and_name_required" }, { status: 400 });
  }

  try {
    const result = await createTrelloList(credentials.accessToken, {
      boardId: body.boardId,
      name: body.name,
    });
    return NextResponse.json(result.output, { status: 201 });
  } catch {
    return NextResponse.json({ error: "trello_request_failed" }, { status: 502 });
  }
}
