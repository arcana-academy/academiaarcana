import { NextResponse } from "next/server";

import {
  decryptNotionCredentials,
  revokeNotionAccessToken,
  NOTION_CREDENTIALS_COOKIE,
} from "@/infrastructure/integrations/notion";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
  const claims = await requireAuthenticatedUser();
  const cookieStore = await cookies();
  const credentials = await decryptNotionCredentials(
    cookieStore.get(NOTION_CREDENTIALS_COOKIE)?.value,
  );

  cookieStore.delete(NOTION_CREDENTIALS_COOKIE);

  if (credentials?.subjectId === claims.sub && credentials.accessToken) {
    try {
      await revokeNotionAccessToken(credentials.accessToken);
    } catch {
      // Local disconnect remains successful when remote revocation is unavailable.
    }
  }

  return NextResponse.json({ connected: false }, { status: 200 });
}
