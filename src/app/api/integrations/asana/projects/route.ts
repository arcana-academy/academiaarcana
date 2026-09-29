import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ASANA_CREDENTIALS_COOKIE, decryptAsanaCredentials, getAsanaProjects,
} from "@/infrastructure/integrations/asana";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const claims = await requireAuthenticatedUser();
  const cookieStore = await cookies();
  const credentials = await decryptAsanaCredentials(cookieStore.get(ASANA_CREDENTIALS_COOKIE)?.value);
  if (!credentials || credentials.subjectId !== claims.sub) {
    return NextResponse.json({ providerId: "asana", status: "disconnected", projects: [] }, {
      status: 200, headers: { "Cache-Control": "private, no-store" },
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
