import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ASANA_CREDENTIALS_COOKIE,
  decryptAsanaCredentials,
  encryptAsanaCredentials,
  refreshAsanaCredentials,
  shouldRefreshAsanaCredentials,
  verifyAsanaConnection,
} from "@/infrastructure/integrations/asana";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const claims = await requireAuthenticatedUser();
  const cookieStore = await cookies();
  let credentials = await decryptAsanaCredentials(cookieStore.get(ASANA_CREDENTIALS_COOKIE)?.value);

  if (!credentials || credentials.subjectId !== claims.sub) {
    cookieStore.delete(ASANA_CREDENTIALS_COOKIE);
    return NextResponse.json({ providerId: "asana", status: "disconnected" }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  try {
    if (shouldRefreshAsanaCredentials(credentials)) {
      credentials = await refreshAsanaCredentials(credentials);
      cookieStore.set(ASANA_CREDENTIALS_COOKIE, await encryptAsanaCredentials(credentials), {
        httpOnly: true, maxAge: 365 * 24 * 60 * 60, path: "/",
        sameSite: "lax", secure: true,
      });
    }

    const verification = await verifyAsanaConnection(credentials.accessToken);
    return NextResponse.json({
      providerId: verification.providerId,
      status: verification.status,
      user: verification.user,
      verifiedAt: verification.verifiedAt,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({
      providerId: "asana", status: "reauthorization_required",
    }, { headers: { "Cache-Control": "private, no-store" } });
  }
}
