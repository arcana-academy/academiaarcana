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

async function resolveSource(request: Request) {
  const user = await requireAuthenticatedUser();
  const params = new URL(request.url).searchParams;
  const siteId = params.get("siteId")?.trim();
  const driveId = params.get("driveId")?.trim();
  const itemId = params.get("itemId")?.trim();

  if (!siteId || !driveId || !itemId) {
    return NextResponse.json(
      { error: "site_id_drive_id_and_item_id_required" },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(MICROSOFT_SHAREPOINT_CREDENTIALS_COOKIE)?.value;
  const credentials = await decryptMicrosoftSharePointCredentials(raw);

  if (!credentials || credentials.subjectId !== user.id) {
    return NextResponse.json({ error: "microsoft_sharepoint_not_connected" }, { status: 401 });
  }

  try {
    const validCredentials = await getValidMicrosoftSharePointCredentials(credentials);
    const result = await getMicrosoftSharePointSiteItemMetadata(
      siteId,
      driveId,
      itemId,
      validCredentials.accessToken,
    );

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

    const output = result.output as Record<string, unknown>;
    const source = {
      providerId: result.providerId,
      type: "external_document" as const,
      name: output.name ?? null,
      mimeType: output.file && typeof output.file === "object"
        ? (output.file as Record<string, unknown>).mimeType ?? null
        : null,
      webUrl: output.webUrl ?? null,
      lastModifiedDateTime: output.lastModifiedDateTime ?? null,
      size: output.size ?? null,
      siteId,
      driveId,
      itemId,
    };

    return source;
  } catch {
    throw new Error("microsoft_sharepoint_document_unavailable");
  }
}

export async function GET(request: Request) {
  try {
    const source = await resolveSource(request);
    return NextResponse.json({ source });
  } catch (error) {
    const message = error instanceof Error ? error.message : "microsoft_sharepoint_document_unavailable";
    return NextResponse.json({ error: message }, { status: message === "microsoft_sharepoint_document_unavailable" ? 404 : 401 });
  }
}

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser();
  let body: { siteId?: unknown; driveId?: unknown; itemId?: unknown };
  try { body = (await request.json()) as typeof body; } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const siteId = typeof body.siteId === "string" ? body.siteId.trim() : "";
  const driveId = typeof body.driveId === "string" ? body.driveId.trim() : "";
  const itemId = typeof body.itemId === "string" ? body.itemId.trim() : "";
  if (!siteId || !driveId || !itemId) return NextResponse.json({ error: "site_id_drive_id_and_item_id_required" }, { status: 400 });

  try {
    const source = await resolveSource(new Request(new URL(`/api/integrations/microsoft-sharepoint/context?siteId=${encodeURIComponent(siteId)}&driveId=${encodeURIComponent(driveId)}&itemId=${encodeURIComponent(itemId)}`, request.url)));
    const supabase = await createClient();
    const { data, error } = await supabase.from("external_document_sources").upsert({
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
      metadata: { origin: "microsoft-sharepoint", selectedAt: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    }, { onConflict: "owner_id,provider_id,site_id,drive_id,item_id" }).select("id, provider_id, source_type, name, mime_type, web_url, last_modified_at, size_bytes, site_id, drive_id, item_id, status, created_at, updated_at").single();
    if (error) throw new Error("external_source_persistence_failed");
    return NextResponse.json({ source: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "microsoft_sharepoint_source_save_failed" }, { status: 502 });
  }
}
