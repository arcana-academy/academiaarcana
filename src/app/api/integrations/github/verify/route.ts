import { NextResponse } from "next/server";

import {
  DEFAULT_GITHUB_VERIFICATION_REPOSITORY,
  GitHubConnectionError,
  verifyGitHubConnection,
} from "@/infrastructure/integrations/github/public-github";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await verifyGitHubConnection({
      repository:
        process.env.GITHUB_VERIFICATION_REPOSITORY ??
        DEFAULT_GITHUB_VERIFICATION_REPOSITORY,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const isKnownError = error instanceof GitHubConnectionError;
    const status =
      isKnownError && error.httpStatus === 400
        ? 500
        : 502;

    return NextResponse.json(
      {
        providerId: "github",
        pluginName: "GitHub",
        status: "error",
        message: "GitHub connection verification failed.",
        verifiedAt: new Date().toISOString(),
      },
      {
        status,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
