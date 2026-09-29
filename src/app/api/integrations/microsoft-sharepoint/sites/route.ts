import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  decryptMicrosoftSharePointCredentials,
  getValidMicrosoftSharePointCredentials,
  MICROSOFT_SHAREPOINT_CREDENTIALS_COOKIE,
  listMicrosoftSharePointSites,
} from "@/infrastructure/integrations/microsoft-sharepoint";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireAuthenticatedUser();
  const cookieStore = await cookies();
  const raw = cookieStore.get(MICROSOFT_SHAREPOINT_CREDENTIALS_COOKIE)?.value;
  const credentials = await decryptMicrosoftSharePointCredentials(raw);

  if (!credentials || credentials.subjectId !== user.id) {
    return NextResponse.json({ error: "microsoft_sharepoint_not_connected" }, { status: 401 });
  }

  try {
    const validCredentials = await getValidMicrosoftSharePointCredentials(credentials);
    const result = await listMicrosoftSharePointSites(validCredentials.accessToken);

    if (validCredentials.accessToken !== credentials.accessToken) {
      const { encryptMicrosoftSharePointCredentials } = await import(
        "@/infrastructure/integrations/microsoft-sharepoint"
      );
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
