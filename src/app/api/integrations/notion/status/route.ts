import { NextResponse } from "next/server";

import {
  NOTION_CREDENTIALS_COOKIE,
  NotionConnectionError,
  verifyNotionConnection,
} from "@/infrastructure/integrations/notion";
import {
  getNotionCredentialsContext,
  persistNotionCredentials,
  refreshAndPersistNotionCredentials,
} from "../_lib";

export const dynamic = "force-dynamic";

export async function GET() {
  const { cookieStore, credentials } = await getNotionCredentialsContext();

  if (!credentials) {
    return NextResponse.json(
      { providerId: "notion", status: "disconnected" },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const verification = await verifyNotionConnection(credentials.accessToken, {
      id: credentials.workspaceId,
      name: credentials.workspaceName,
    });

    return NextResponse.json(
      {
        providerId: verification.providerId,
        status: verification.status,
        user: verification.user,
        workspace: verification.workspace,
        verifiedAt: verification.verifiedAt,
      },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (
      error instanceof NotionConnectionError &&
      error.code === "reauthorization_required" &&
      credentials.refreshToken
    ) {
      try {
        const refreshed = await refreshAndPersistNotionCredentials(
          cookieStore,
          credentials,
        );
        const verification = await verifyNotionConnection(
          refreshed.accessToken,
          {
            id: refreshed.workspaceId,
            name: refreshed.workspaceName,
          },
        );
        return NextResponse.json(
          {
            providerId: verification.providerId,
            status: verification.status,
            user: verification.user,
            workspace: verification.workspace,
            verifiedAt: verification.verifiedAt,
          },
          { status: 200, headers: { "Cache-Control": "private, no-store" } },
        );
      } catch {
        cookieStore.delete(NOTION_CREDENTIALS_COOKIE);
      }
    } else {
      cookieStore.delete(NOTION_CREDENTIALS_COOKIE);
    }

    return NextResponse.json(
      { providerId: "notion", status: "reauthorization_required" },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
