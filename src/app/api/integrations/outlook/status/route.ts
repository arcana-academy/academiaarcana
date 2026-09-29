import { NextResponse } from "next/server";

import {
  OUTLOOK_CALENDAR_INTEGRATION_DEFINITION,
} from "@/infrastructure/integrations/outlook-calendar";
import { isOutlookCalendarConnected } from "@/infrastructure/integrations/outlook-calendar-session";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export async function GET() {
  await requireAuthenticatedUser();
  return NextResponse.json({
    provider: OUTLOOK_CALENDAR_INTEGRATION_DEFINITION,
    connected: await isOutlookCalendarConnected(),
  });
}
