import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ASANA_CREDENTIALS_COOKIE,
  AsanaConnectionError,
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

  // A provider-side refresh failure does not prove a revoked authorization:
  // the current adapter reports all non-2xx refresh responses as
  // "reauthorization_required", including 429 and 5xx.
  let verificationStarted = false;
  try {
    if (shouldRefreshAsanaCredentials(credentials)) {
      credentials = await refreshAsanaCredentials(credentials);
      cookieStore.set(ASANA_CREDENTIALS_COOKIE, await encryptAsanaCredentials(credentials), {
        httpOnly: true, maxAge: 365 * 24 * 60 * 60, path: "/",
        sameSite: "lax", secure: true,
      });
    }

    verificationStarted = true;
    const verification = await verifyAsanaConnection(credentials.accessToken);
    return NextResponse.json({
      providerId: verification.providerId,
      status: verification.status,
      user: verification.user,
      verifiedAt: verification.verifiedAt,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    // Only a rejection from account verification (after token preparation)
    // can establish that the authorization should be renewed. Rate limits,
    // provider outages, malformed replies and refresh failures are transient
    // from this endpoint's perspective and must not trigger false reconnect.
    const authorizationRejected =
      verificationStarted &&
      error instanceof AsanaConnectionError &&
      (error.code === "reauthorization_required" ||
        error.code === "insufficient_scope");
    return NextResponse.json(
      {
        providerId: "asana",
        status: authorizationRejected ? "reauthorization_required" : "request_failed",
      },
      {
        status: authorizationRejected ? 200 : 502,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }
}
