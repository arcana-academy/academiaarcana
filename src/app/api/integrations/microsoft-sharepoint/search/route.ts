import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  decryptMicrosoftSharePointCredentials,
  encryptMicrosoftSharePointCredentials,
  getValidMicrosoftSharePointCredentials,
  MICROSOFT_SHAREPOINT_CREDENTIALS_COOKIE,
  searchMicrosoftSharePointSiteDrive,
} from "@/infrastructure/integrations/microsoft-sharepoint";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireAuthenticatedUser();
  const params = new URL(request.url).searchParams;
  const siteId = params.get("siteId")?.trim();
  const driveId = params.get("driveId")?.trim();
  const query = params.get("q")?.trim();

  if (!siteId || !driveId || !query) {
    return NextResponse.json(
      { error: "site_id_drive_id_and_query_required" },
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
    const result = await searchMicrosoftSharePointSiteDrive(
      siteId,
      driveId,
      query,
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

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "microsoft_sharepoint_search_failed" },
      { status: 502 },
    );
  }
}
