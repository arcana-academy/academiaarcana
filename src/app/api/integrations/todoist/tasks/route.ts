import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  closeTodoistTask,
  createTodoistTask,
  decryptTodoistCredentials,
  encryptTodoistCredentials,
  getTodoistProjects,
  getTodoistTasks,
  refreshTodoistCredentials,
  shouldRefreshTodoistCredentials,
  TODOIST_CREDENTIALS_COOKIE,
} from "@/infrastructure/integrations/todoist";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

async function getCredentialsOrUnauthorized() {
  await requireAuthenticatedUser();
  const cookieStore = await cookies();
  let credentials = await decryptTodoistCredentials(
    cookieStore.get(TODOIST_CREDENTIALS_COOKIE)?.value,
  );

  if (!credentials) return { credentials: null, cookieStore, status: "disconnected" as const };

  if (shouldRefreshTodoistCredentials(credentials)) {
    try {
      credentials = await refreshTodoistCredentials(credentials);
      cookieStore.set(
        TODOIST_CREDENTIALS_COOKIE,
        await encryptTodoistCredentials(credentials),
        {
          httpOnly: true,
          maxAge: 365 * 24 * 60 * 60,
          path: "/",
          sameSite: "lax",
          secure: true,
        },
      );
    } catch {
      cookieStore.delete(TODOIST_CREDENTIALS_COOKIE);
      return {
        credentials: null,
        cookieStore,
        status: "reauthorization_required" as const,
      };
    }
  }

  return { credentials, cookieStore, status: "connected" as const };
}

export async function GET() {
  const { credentials } = await getCredentialsOrUnauthorized();

  if (!credentials) {
    return NextResponse.json(
      { status },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const [tasks, projects] = await Promise.all([
      getTodoistTasks(credentials.accessToken),
      getTodoistProjects(credentials.accessToken),
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
  const { credentials } = await getCredentialsOrUnauthorized();

  if (!credentials) {
    return NextResponse.json(
      { error: status },
      { status: status === "reauthorization_required" ? 401 : 409 },
    );
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
    const result = await createTodoistTask(credentials.accessToken, {
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


export async function PATCH(request: Request) {
  const { credentials } = await getCredentialsOrUnauthorized();

  if (!credentials) {
    return NextResponse.json({ error: "todoist_not_connected" }, { status: 409 });
  }

  const body = (await request.json().catch(() => null)) as
    | { taskId?: string }
    | null;

  if (!body?.taskId?.trim()) {
    return NextResponse.json({ error: "task_id_required" }, { status: 400 });
  }

  try {
    const result = await closeTodoistTask(credentials.accessToken, body.taskId);
    return NextResponse.json(result.output, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "todoist_request_failed" },
      { status: 502 },
    );
  }
}
