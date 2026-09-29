import { NextResponse } from "next/server";

import {
  getTrelloBoard,
  getTrelloCards,
  getTrelloLists,
} from "@/infrastructure/integrations/trello";
import { getTrelloCredentialsContext } from "../../_lib";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ boardId: string }> },
) {
  const { credentials, status } = await getTrelloCredentialsContext();
  if (!credentials) {
    return NextResponse.json(
      { status },
      { status: status === "reauthorization_required" ? 401 : 200 },
    );
  }

  const { boardId } = await context.params;

  try {
    const [board, lists, cards] = await Promise.all([
      getTrelloBoard(credentials.accessToken, boardId),
      getTrelloLists(credentials.accessToken, boardId),
      getTrelloCards(credentials.accessToken, boardId),
    ]);

    return NextResponse.json(
      {
        status: "connected",
        board: board.output,
        lists: lists.output,
        cards: cards.output,
      },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({ status: "trello_request_failed" }, { status: 502 });
  }
}
