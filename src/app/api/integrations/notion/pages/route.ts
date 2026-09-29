import { NextResponse } from "next/server";

import {
  createNotionPage,
  NotionConnectionError,
  searchNotion,
} from "@/infrastructure/integrations/notion";
import { getNotionCredentialsContext } from "../_lib";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { credentials } = await getNotionCredentialsContext();

  if (!credentials) {
    return NextResponse.json(
      { status: "disconnected", results: [] },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const query = new URL(request.url).searchParams.get("query") ?? "";

  try {
    const result = await searchNotion(credentials.accessToken, query);
    return NextResponse.json(
      { status: "connected", results: result.output },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status:
          error instanceof NotionConnectionError &&
          error.code === "reauthorization_required"
            ? "reauthorization_required"
            : "request_failed",
        results: [],
      },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}

export async function POST(request: Request) {
  const { credentials } = await getNotionCredentialsContext();

  if (!credentials) {
    return NextResponse.json({ error: "disconnected" }, { status: 409 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        parentPageId?: string;
        title?: string;
        body?: string;
      }
    | null;

  if (!body?.parentPageId?.trim() || !body?.title?.trim()) {
    return NextResponse.json(
      { error: "parent_page_id_and_title_required" },
      { status: 400 },
    );
  }

  try {
    const result = await createNotionPage(credentials.accessToken, {
      parentPageId: body.parentPageId,
      title: body.title,
      body: body.body,
    });
    return NextResponse.json(result.output, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof NotionConnectionError
            ? error.code
            : "request_failed",
      },
      { status: error instanceof NotionConnectionError && error.code === "reauthorization_required" ? 401 : 502 },
    );
  }
}
