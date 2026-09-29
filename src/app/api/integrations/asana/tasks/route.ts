import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ASANA_CREDENTIALS_COOKIE, decryptAsanaCredentials, closeAsanaTask,
  createAsanaTask, getAsanaTasks,
} from "@/infrastructure/integrations/asana";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

async function credentialsForUser() {
  const claims = await requireAuthenticatedUser();
  const cookieStore = await cookies();
  const credentials = await decryptAsanaCredentials(cookieStore.get(ASANA_CREDENTIALS_COOKIE)?.value);
  return credentials?.subjectId === claims.sub ? credentials : null;
}

export async function GET(request: Request) {
  const credentials = await credentialsForUser();
  if (!credentials) return NextResponse.json({ providerId: "asana", status: "disconnected", tasks: [] }, {
    headers: { "Cache-Control": "private, no-store" },
  });
  const projectId = new URL(request.url).searchParams.get("projectId") ?? undefined;
  try {
    const result = await getAsanaTasks(credentials.accessToken, projectId);
    return NextResponse.json({ tasks: result.output }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ providerId: "asana", status: "error", tasks: [] }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const credentials = await credentialsForUser();
  if (!credentials) return NextResponse.json({ providerId: "asana", status: "disconnected" }, { status: 401 });

  try {
    const body = await request.json() as {
      name?: string; notes?: string; dueOn?: string; dueAt?: string; projectId?: string;
    };
    const result = await createAsanaTask(credentials.accessToken, {
      name: body.name ?? "",
      notes: body.notes,
      dueOn: body.dueOn,
      dueAt: body.dueAt,
      projectId: body.projectId,
    });
    return NextResponse.json({ task: result.output }, { status: 201 });
  } catch {
    return NextResponse.json({ providerId: "asana", status: "error" }, { status: 502 });
  }
}

export async function PATCH(request: Request) {
  const credentials = await credentialsForUser();
  if (!credentials) return NextResponse.json({ providerId: "asana", status: "disconnected" }, { status: 401 });

  try {
    const body = await request.json() as { taskId?: string };
    const result = await closeAsanaTask(credentials.accessToken, body.taskId ?? "");
    return NextResponse.json({ task: result.output });
  } catch {
    return NextResponse.json({ providerId: "asana", status: "error" }, { status: 502 });
  }
}
