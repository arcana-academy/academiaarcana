import { NextResponse } from "next/server";

import {
  createTrelloBoard,
  getTrelloBoards,
  TrelloConnectionError,
} from "@/infrastructure/integrations/trello";
import { getTrelloCredentialsContext } from "../_lib";

export const dynamic = "force-dynamic";

export async function GET() {
  const { credentials, status } = await getTrelloCredentialsContext();
  if (!credentials) {
    return NextResponse.json(
      { status },
      { status: status === "request_failed" ? 502 : status === "reauthorization_required" ? 401 : 200, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const result = await getTrelloBoards(credentials.accessToken);
    return NextResponse.json(
      { status: "connected", boards: result.output },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    const authorizationRejected =
      error instanceof TrelloConnectionError &&
      (error.httpStatus === 401 || error.httpStatus === 403);
    return NextResponse.json(
      {
        status: authorizationRejected
          ? "reauthorization_required"
          : "trello_request_failed",
      },
      {
        status: authorizationRejected ? 401 : 502,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }
}

export async function POST(request: Request) {
  const { credentials, status } = await getTrelloCredentialsContext();
  if (!credentials) {
    return NextResponse.json(
      { error: status },
      { status: status === "request_failed" ? 502 : status === "reauthorization_required" ? 401 : 409, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { name?: string; description?: string }
    | null;
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "name_required" }, { status: 400 });
  }

  try {
    const result = await createTrelloBoard(credentials.accessToken, {
      name: body.name,
      description: body.description,
    });
    return NextResponse.json(result.output, { status: 201 });
  } catch {
    return NextResponse.json({ error: "trello_request_failed" }, { status: 502 });
  }
}
