import { cookies } from "next/headers";

import {
  decryptNotionCredentials,
  encryptNotionCredentials,
  refreshNotionCredentials,
  type NotionCredentials,
  NOTION_CREDENTIALS_COOKIE,
} from "@/infrastructure/integrations/notion";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export async function getNotionCredentialsContext() {
  const claims = await requireAuthenticatedUser();
  const cookieStore = await cookies();
  const credentials = await decryptNotionCredentials(
    cookieStore.get(NOTION_CREDENTIALS_COOKIE)?.value,
  );

  if (!credentials || credentials.subjectId !== claims.sub) {
    cookieStore.delete(NOTION_CREDENTIALS_COOKIE);
    return {
      claims,
      cookieStore,
      credentials: null,
      status: "disconnected" as const,
    };
  }

  return {
    claims,
    cookieStore,
    credentials,
    status: "connected" as const,
  };
}

export async function persistNotionCredentials(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  credentials: NotionCredentials,
) {
  cookieStore.set(
    NOTION_CREDENTIALS_COOKIE,
    await encryptNotionCredentials(credentials),
    {
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  );
}

export async function refreshAndPersistNotionCredentials(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  credentials: NotionCredentials,
) {
  const refreshed = await refreshNotionCredentials(credentials);
  await persistNotionCredentials(cookieStore, refreshed);
  return refreshed;
}
