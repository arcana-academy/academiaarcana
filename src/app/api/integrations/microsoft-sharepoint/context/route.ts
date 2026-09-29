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

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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
    return NextResponse.json({
      source: {
        providerId: result.providerId,
        type: "external_document",
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
      },
    });
  } catch {
    return NextResponse.json(
      { error: "microsoft_sharepoint_document_unavailable" },
      { status: 404 },
    );
  }
}
