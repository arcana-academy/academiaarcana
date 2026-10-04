import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  decryptMicrosoftSharePointCredentials,
  encryptMicrosoftSharePointCredentials,
  getMicrosoftSharePointSiteItemMetadata,
  getValidMicrosoftSharePointCredentials,
  MICROSOFT_SHAREPOINT_CREDENTIALS_COOKIE,
} from "@/infrastructure/integrations/microsoft-sharepoint";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SharePointSource = {
  readonly providerId: string;
  readonly type: "external_document";
  readonly name: string | null;
  readonly mimeType: string | null;
  readonly webUrl: string | null;
  readonly lastModifiedDateTime: string | null;
  readonly size: number | null;
  readonly siteId: string;
  readonly driveId: string;
  readonly itemId: string;
};

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function statusForError(message: string): number {
  switch (message) {
    case "site_id_drive_id_and_item_id_required":
      return 400;
    case "microsoft_sharepoint_not_connected":
      return 401;
    case "microsoft_sharepoint_document_unavailable":
      return 404;
    case "external_source_persistence_failed":
      return 502;
    default:
      return 502;
  }
}

async function resolveSource(
  request: Request,
  userId: string,
): Promise<SharePointSource> {
  const params = new URL(request.url).searchParams;
  const siteId = params.get("siteId")?.trim();
  const driveId = params.get("driveId")?.trim();
  const itemId = params.get("itemId")?.trim();

  if (!siteId || !driveId || !itemId) {
    throw new Error("site_id_drive_id_and_item_id_required");
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(MICROSOFT_SHAREPOINT_CREDENTIALS_COOKIE)?.value;
  const credentials = await decryptMicrosoftSharePointCredentials(raw);

  if (!credentials || credentials.subjectId !== userId) {
    throw new Error("microsoft_sharepoint_not_connected");
  }

  let validCredentials;
  try {
    validCredentials =
      await getValidMicrosoftSharePointCredentials(credentials);
  } catch {
    throw new Error("microsoft_sharepoint_not_connected");
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
    const result = await getMicrosoftSharePointSiteItemMetadata(
      siteId,
      driveId,
      itemId,
      validCredentials.accessToken,
    );

    const output =
      result.output && typeof result.output === "object"
        ? (result.output as Record<string, unknown>)
        : null;

    const file =
      output?.file && typeof output.file === "object"
        ? (output.file as Record<string, unknown>)
        : null;

    return {
      providerId: result.providerId,
      type: "external_document",
      name: nullableString(output?.name),
      mimeType: nullableString(file?.mimeType),
      webUrl: nullableString(output?.webUrl),
      lastModifiedDateTime: nullableString(output?.lastModifiedDateTime),
      size: nullableNumber(output?.size),
      siteId,
      driveId,
      itemId,
    };
  } catch {
    throw new Error("microsoft_sharepoint_document_unavailable");
  }
}

export async function GET(request: Request) {
  const user = await requireAuthenticatedUser();

  try {
    const source = await resolveSource(request, user.id);
    return NextResponse.json({ source });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "microsoft_sharepoint_document_unavailable";

    return NextResponse.json(
      { error: message },
      { status: statusForError(message) },
    );
  }
}

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser();

  let body: {
    readonly siteId?: unknown;
    readonly driveId?: unknown;
    readonly itemId?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const siteId = typeof body.siteId === "string" ? body.siteId.trim() : "";
  const driveId = typeof body.driveId === "string" ? body.driveId.trim() : "";
  const itemId = typeof body.itemId === "string" ? body.itemId.trim() : "";

  if (!siteId || !driveId || !itemId) {
    return NextResponse.json(
      { error: "site_id_drive_id_and_item_id_required" },
      { status: 400 },
    );
  }

  try {
    const contextUrl = new URL(
      "/api/integrations/microsoft-sharepoint/context",
      request.url,
    );
    contextUrl.searchParams.set("siteId", siteId);
    contextUrl.searchParams.set("driveId", driveId);
    contextUrl.searchParams.set("itemId", itemId);

    const source = await resolveSource(
      new Request(contextUrl),
      user.id,
    );

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("external_document_sources")
      .upsert(
        {
          owner_id: user.id,
          provider_id: source.providerId,
          source_type: source.type,
          site_id: source.siteId,
          drive_id: source.driveId,
          item_id: source.itemId,
          name: source.name,
          mime_type: source.mimeType,
          web_url: source.webUrl,
          last_modified_at: source.lastModifiedDateTime,
          size_bytes: source.size,
          status: "active",
          metadata: {
            origin: "microsoft-sharepoint",
            selectedAt: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "owner_id,provider_id,site_id,drive_id,item_id" },
      )
      .select(
        "id, provider_id, source_type, name, mime_type, web_url, last_modified_at, size_bytes, site_id, drive_id, item_id, status, created_at, updated_at",
      )
      .single();

    if (error || !data) {
      throw new Error("external_source_persistence_failed");
    }

    return NextResponse.json({ source: data }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "microsoft_sharepoint_source_save_failed";

    return NextResponse.json(
      { error: message },
      { status: statusForError(message) },
    );
  }
}
