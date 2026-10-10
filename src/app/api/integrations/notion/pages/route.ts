import { NextResponse } from "next/server";

import {
  createNotionPage,
  NotionConnectionError,
  searchNotion,
  type NotionCredentials,
} from "@/infrastructure/integrations/notion";
import {
  getNotionCredentialsContext,
  refreshAndPersistNotionCredentials,
} from "../_lib";

export const dynamic = "force-dynamic";

/**
 * Reuse the subject-validated credentials context and retry only after an
 * upstream authorization error. A successful refresh persists the rotated
 * token before any retry; unrelated errors are never retried.
 */
async function withNotionTokenRecovery<T>(
  cookieStore: Awaited<ReturnType<typeof getNotionCredentialsContext>>["cookieStore"],
  credentials: NotionCredentials,
  operation: (accessToken: string) => Promise<T>,
): Promise<T> {
  try {
    return await operation(credentials.accessToken);
  } catch (error) {
    if (
      !(error instanceof NotionConnectionError) ||
      error.code !== "reauthorization_required" ||
      !credentials.refreshToken
    ) {
      throw error;
    }

    const refreshed = await refreshAndPersistNotionCredentials(
      cookieStore,
      credentials,
    );
    return operation(refreshed.accessToken);
  }
}

export async function GET(request: Request) {
  const { cookieStore, credentials } = await getNotionCredentialsContext();

  if (!credentials) {
    return NextResponse.json(
      { status: "disconnected", results: [] },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const query = new URL(request.url).searchParams.get("query") ?? "";

  try {
    const result = await withNotionTokenRecovery(
      cookieStore,
      credentials,
      (token) => searchNotion(token, query),
    );
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
  const { cookieStore, credentials } = await getNotionCredentialsContext();

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

  // Keep validated inputs stable across the async retry closure.
  const parentPageId = body.parentPageId;
  const title = body.title;
  const pageBody = body.body;

  try {
    const result = await withNotionTokenRecovery(
      cookieStore,
      credentials,
      (token) =>
        createNotionPage(token, {
          parentPageId,
          title,
          body: pageBody,
        }),
    );
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
