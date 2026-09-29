import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  createTodoistTask,
  getTodoistProjects,
  getTodoistTasks,
  TODOIST_ACCESS_TOKEN_COOKIE,
} from "@/infrastructure/integrations/todoist";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

async function getTokenOrUnauthorized() {
  await requireAuthenticatedUser();
  return (await cookies()).get(TODOIST_ACCESS_TOKEN_COOKIE)?.value ?? null;
}

export async function GET() {
  const token = await getTokenOrUnauthorized();

  if (!token) {
    return NextResponse.json({ status: "disconnected" }, { status: 200 });
  }

  try {
    const [tasks, projects] = await Promise.all([
      getTodoistTasks(token),
      getTodoistProjects(token),
    ]);

    return NextResponse.json(
      { status: "connected", tasks: tasks.output, projects: projects.output },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "reauthorization_required" },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}

export async function POST(request: Request) {
  const token = await getTokenOrUnauthorized();

  if (!token) {
    return NextResponse.json({ error: "todoist_not_connected" }, { status: 409 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        content?: string;
        description?: string;
        dueDateTime?: string | null;
      }
    | null;

  if (!body?.content?.trim()) {
    return NextResponse.json({ error: "content_required" }, { status: 400 });
  }

  try {
    const result = await createTodoistTask(token, {
      content: body.content,
      description: body.description,
      dueDateTime: body.dueDateTime,
    });

    return NextResponse.json(result.output, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "todoist_request_failed" },
      { status: 502 },
    );
  }
}
