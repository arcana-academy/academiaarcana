import { NextResponse } from "next/server";

import {
  NOTION_CREDENTIALS_COOKIE,
  NotionConnectionError,
  verifyNotionConnection,
} from "@/infrastructure/integrations/notion";
import {
  getNotionCredentialsContext,
  refreshAndPersistNotionCredentials,
} from "../_lib";

export const dynamic = "force-dynamic";

function verificationUnavailable() {
  return NextResponse.json(
    { providerId: "notion", status: "request_failed" },
    { status: 502, headers: { "Cache-Control": "private, no-store" } },
  );
}

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
    // A temporary upstream failure must not revoke a valid local connection.
    if (
      !(error instanceof NotionConnectionError) ||
      error.code !== "reauthorization_required"
    ) {
      return verificationUnavailable();
    }

    if (credentials.refreshToken) {
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
      } catch (refreshError) {
        // Preserve the credential (including a newly rotated refresh token)
        // when the provider is unreachable after a refresh attempt.
        if (
          !(refreshError instanceof NotionConnectionError) ||
          refreshError.code !== "reauthorization_required"
        ) {
          return verificationUnavailable();
        }
      }
    }

    // Only a confirmed authorization failure requires reconnection.
    cookieStore.delete(NOTION_CREDENTIALS_COOKIE);
    return NextResponse.json(
      { providerId: "notion", status: "reauthorization_required" },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
