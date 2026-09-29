import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ASANA_CREDENTIALS_COOKIE, decryptAsanaCredentials, revokeAsanaAccessToken,
} from "@/infrastructure/integrations/asana";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

export async function POST() {
  const claims = await requireAuthenticatedUser();
  const cookieStore = await cookies();
  const credentials = await decryptAsanaCredentials(cookieStore.get(ASANA_CREDENTIALS_COOKIE)?.value);

  cookieStore.delete(ASANA_CREDENTIALS_COOKIE);

  if (credentials?.subjectId === claims.sub) {
    try { await revokeAsanaAccessToken(credentials.accessToken); } catch { /* local disconnect still succeeds */ }
  }

  return NextResponse.json({ providerId: "asana", status: "disconnected" }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
