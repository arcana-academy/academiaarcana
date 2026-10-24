import { NextResponse } from "next/server";

import {
  OUTLOOK_CALENDAR_INTEGRATION_DEFINITION,
} from "@/infrastructure/integrations/outlook-calendar";
import { isOutlookCalendarConnected } from "@/infrastructure/integrations/outlook-calendar-session";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export async function GET() {
  await requireAuthenticatedUser();

  // A transient credentials-store failure must not masquerade as a genuine
  // disconnect or disclose provider diagnostics to an authenticated learner.
  try {
    const connected = await isOutlookCalendarConnected();

    return NextResponse.json(
      { provider: OUTLOOK_CALENDAR_INTEGRATION_DEFINITION, connected },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        provider: OUTLOOK_CALENDAR_INTEGRATION_DEFINITION,
        connected: null,
        status: "unavailable",
      },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
