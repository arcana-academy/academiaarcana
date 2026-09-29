import { cookies } from "next/headers";

import {
  decryptTrelloCredentials,
  encryptTrelloCredentials,
  refreshTrelloCredentials,
  shouldRefreshTrelloCredentials,
  TRELLO_CREDENTIALS_COOKIE,
  type TrelloCredentials,
} from "@/infrastructure/integrations/trello";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export async function persistTrelloCredentials(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  credentials: TrelloCredentials,
) {
  cookieStore.set(
    TRELLO_CREDENTIALS_COOKIE,
    await encryptTrelloCredentials(credentials),
    {
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  );
}

export async function getTrelloCredentialsContext() {
  const claims = await requireAuthenticatedUser();
  const cookieStore = await cookies();
  let credentials = await decryptTrelloCredentials(
    cookieStore.get(TRELLO_CREDENTIALS_COOKIE)?.value,
  );

  if (!credentials || credentials.subjectId !== claims.sub) {
    cookieStore.delete(TRELLO_CREDENTIALS_COOKIE);
    return { credentials: null, cookieStore, status: "disconnected" as const };
  }

  if (shouldRefreshTrelloCredentials(credentials)) {
    try {
      credentials = await refreshTrelloCredentials(credentials);
      await persistTrelloCredentials(cookieStore, credentials);
    } catch {
      cookieStore.delete(TRELLO_CREDENTIALS_COOKIE);
      return {
        credentials: null,
        cookieStore,
        status: "reauthorization_required" as const,
      };
    }
  }

  return { credentials, cookieStore, status: "connected" as const };
}
