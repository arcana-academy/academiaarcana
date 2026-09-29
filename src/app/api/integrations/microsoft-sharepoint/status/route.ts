import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  decryptMicrosoftSharePointCredentials,
  encryptMicrosoftSharePointCredentials,
  getValidMicrosoftSharePointCredentials,
  MICROSOFT_SHAREPOINT_CREDENTIALS_COOKIE,
  verifyMicrosoftSharePointConnection,
} from "@/infrastructure/integrations/microsoft-sharepoint";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireAuthenticatedUser();
  const cookieStore = await cookies();
  const raw = cookieStore.get(MICROSOFT_SHAREPOINT_CREDENTIALS_COOKIE)?.value;
  const credentials = await decryptMicrosoftSharePointCredentials(raw);

  if (!credentials || credentials.subjectId !== user.id) {
    return NextResponse.json({ status: "disconnected" });
  }

  try {
    const validCredentials = await getValidMicrosoftSharePointCredentials(credentials);\n    if (validCredentials.accessToken !== credentials.accessToken) {\n      cookieStore.set(MICROSOFT_SHAREPOINT_CREDENTIALS_COOKIE, await encryptMicrosoftSharePointCredentials(validCredentials), {\n        httpOnly: true,\n        maxAge: 30 * 24 * 60 * 60,\n        path: "/",\n        sameSite: "lax",\n        secure: process.env.NODE_ENV === "production",\n      });\n    }\n    const verification = await verifyMicrosoftSharePointConnection(validCredentials.accessToken);
    return NextResponse.json({
      status: verification.status,
      providerId: verification.providerId,
      verifiedAt: verification.verifiedAt,
    });
  } catch {
    return NextResponse.json(
      { status: "reauthorization_required", providerId: "microsoft-sharepoint" },
      { status: 200 },
    );
  }
}
