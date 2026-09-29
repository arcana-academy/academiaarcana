import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  decryptMicrosoftSharePointCredentials,
  encryptMicrosoftSharePointCredentials,
  getValidMicrosoftSharePointCredentials,
  MICROSOFT_SHAREPOINT_CREDENTIALS_COOKIE,
} from "@/infrastructure/integrations/microsoft-sharepoint";
import { getMicrosoftSharePointDocumentContext } from "@/infrastructure/integrations/microsoft-sharepoint-content";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function statusForError(message: string): number {
  switch (message) {
    case "microsoft_sharepoint_source_id_required":
    case "microsoft_sharepoint_source_not_found":
      return 404;
    case "microsoft_sharepoint_source_revoked":
      return 410;
    case "microsoft_sharepoint_source_stale":
      return 409;
    case "microsoft_sharepoint_document_type_unsupported":
      return 415;
    case "microsoft_sharepoint_document_too_large":
      return 413;
    case "microsoft_sharepoint_source_is_not_file":
      return 422;
    case "microsoft_sharepoint_not_connected":
      return 401;
    default:
      return 502;
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ sourceId: string }> },
) {
  const user = await requireAuthenticatedUser();
  const { sourceId } = await context.params;

  if (!sourceId?.trim()) {
    return NextResponse.json(
      { error: "microsoft_sharepoint_source_id_required" },
      { status: 404 },
    );
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(MICROSOFT_SHAREPOINT_CREDENTIALS_COOKIE)?.value;
  const credentials = await decryptMicrosoftSharePointCredentials(raw);

  if (!credentials || credentials.subjectId !== user.id) {
    return NextResponse.json(
      { error: "microsoft_sharepoint_not_connected" },
      { status: 401 },
    );
  }

  let validCredentials;
  try {
    validCredentials =
      await getValidMicrosoftSharePointCredentials(credentials);
  } catch {
    return NextResponse.json(
      { error: "microsoft_sharepoint_not_connected" },
      { status: 401 },
    );
  }

  if (validCredentials.accessToken !== credentials.accessToken) {
    cookieStore.set(
      MICROSOFT_SHAREPOINT_CREDENTIALS_COOKIE,
      await encryptMicrosoftSharePointCredentials(validCredentials),
      {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    );
  }

  try {
    const supabase = await createClient();
    const document = await getMicrosoftSharePointDocumentContext(sourceId, {
      supabase,
      ownerId: user.id,
      credentials: validCredentials,
    });

    return NextResponse.json(
      { document },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "microsoft_sharepoint_document_unavailable";

    return NextResponse.json(
      { error: message },
      {
        status: statusForError(message),
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
