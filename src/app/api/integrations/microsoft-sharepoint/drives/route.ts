import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  decryptMicrosoftSharePointCredentials,
  encryptMicrosoftSharePointCredentials,
  getValidMicrosoftSharePointCredentials,
  listMicrosoftSharePointSiteDrives,
  MICROSOFT_SHAREPOINT_CREDENTIALS_COOKIE,
} from "@/infrastructure/integrations/microsoft-sharepoint";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireAuthenticatedUser();
  const siteId = new URL(request.url).searchParams.get("siteId")?.trim();

  if (!siteId) {
    return NextResponse.json({ error: "site_id_required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(MICROSOFT_SHAREPOINT_CREDENTIALS_COOKIE)?.value;
  const credentials = await decryptMicrosoftSharePointCredentials(raw);

  if (!credentials || credentials.subjectId !== user.id) {
    return NextResponse.json({ error: "microsoft_sharepoint_not_connected" }, { status: 401 });
  }

  try {
    const validCredentials = await getValidMicrosoftSharePointCredentials(credentials);
    const result = await listMicrosoftSharePointSiteDrives(siteId, validCredentials.accessToken);

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
      { error: "microsoft_sharepoint_reauthorization_required" },
      { status: 401 },
    );
  }
}
