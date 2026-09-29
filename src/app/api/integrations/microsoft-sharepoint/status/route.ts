import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  decryptMicrosoftSharePointCredentials,
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
    const verification = await verifyMicrosoftSharePointConnection(credentials.accessToken);
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
