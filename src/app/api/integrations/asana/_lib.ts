import { cookies } from "next/headers";

import {
  ASANA_CREDENTIALS_COOKIE,
  AsanaConnectionError,
  decryptAsanaCredentials,
  encryptAsanaCredentials,
  refreshAsanaCredentials,
  shouldRefreshAsanaCredentials,
} from "@/infrastructure/integrations/asana";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

/**
 * Resolve a single user's Asana credentials for task and project operations.
 * Unlike the status-only route, these operations must refresh expiring tokens
 * themselves instead of assuming the status page was visited first.
 */
export async function getAsanaCredentialsContext() {
  const claims = await requireAuthenticatedUser();
  const cookieStore = await cookies();
  let credentials = await decryptAsanaCredentials(
    cookieStore.get(ASANA_CREDENTIALS_COOKIE)?.value,
  );

  if (!credentials || credentials.subjectId !== claims.sub) {
    cookieStore.delete(ASANA_CREDENTIALS_COOKIE);
    return { credentials: null, status: "disconnected" as const };
  }

  if (shouldRefreshAsanaCredentials(credentials)) {
    try {
      const refreshed = await refreshAsanaCredentials(credentials);
      // A provider response must never be permitted to change the local owner.
      if (refreshed.subjectId !== claims.sub) {
        cookieStore.delete(ASANA_CREDENTIALS_COOKIE);
        return { credentials: null, status: "reauthorization_required" as const };
      }

      cookieStore.set(
        ASANA_CREDENTIALS_COOKIE,
        await encryptAsanaCredentials(refreshed),
        {
          httpOnly: true,
          maxAge: 365 * 24 * 60 * 60,
          path: "/",
          sameSite: "lax",
          secure: true,
        },
      );
      credentials = refreshed;
    } catch (error) {
      // Retain the subject-bound encrypted cookie on recoverable provider failures.
      // A successful HTTP response with malformed JSON is not evidence of
      // revoked OAuth consent. Keep the encrypted cookie for a future retry.
      if (error instanceof SyntaxError ||
          (error instanceof AsanaConnectionError &&
           (error.code === "request_failed" || error.code === "rate_limited"))) {
        return { credentials: null, status: "request_failed" as const };
      }
      cookieStore.delete(ASANA_CREDENTIALS_COOKIE);
      return { credentials: null, status: "reauthorization_required" as const };
    }
  }

  return { credentials, status: "connected" as const };
}
