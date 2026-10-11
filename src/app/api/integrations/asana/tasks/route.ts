import { NextResponse } from "next/server";
import {
  closeAsanaTask,
  createAsanaTask,
  getAsanaTasks,
} from "@/infrastructure/integrations/asana";
import { getAsanaCredentialsContext } from "../_lib";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { credentials, status } = await getAsanaCredentialsContext();
  if (!credentials) return NextResponse.json({ providerId: "asana", status, tasks: [] }, {
    status: status === "request_failed" ? 502 : 200,
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
  const { credentials, status } = await getAsanaCredentialsContext();
  if (!credentials) return NextResponse.json({ providerId: "asana", status }, { status: status === "request_failed" ? 502 : 401, headers: { "Cache-Control": "private, no-store" } });

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
  const { credentials, status } = await getAsanaCredentialsContext();
  if (!credentials) return NextResponse.json({ providerId: "asana", status }, { status: status === "request_failed" ? 502 : 401, headers: { "Cache-Control": "private, no-store" } });

  try {
    const body = await request.json() as { taskId?: string };
    const result = await closeAsanaTask(credentials.accessToken, body.taskId ?? "");
    return NextResponse.json({ task: result.output });
  } catch {
    return NextResponse.json({ providerId: "asana", status: "error" }, { status: 502 });
  }
}
