import { NextResponse } from "next/server";
import { getAsanaProjects } from "@/infrastructure/integrations/asana";
import { getAsanaCredentialsContext } from "../_lib";

export const dynamic = "force-dynamic";

export async function GET() {
  const { credentials, status } = await getAsanaCredentialsContext();
  if (!credentials) {
    return NextResponse.json({ providerId: "asana", status, projects: [] }, {
      status: status === "request_failed" ? 502 : 200, headers: { "Cache-Control": "private, no-store" },
    });
  }

  try {
    const result = await getAsanaProjects(credentials.accessToken);
    return NextResponse.json({ projects: result.output }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ providerId: "asana", status: "error", projects: [] }, {
      status: 502, headers: { "Cache-Control": "private, no-store" },
    });
  }
}
