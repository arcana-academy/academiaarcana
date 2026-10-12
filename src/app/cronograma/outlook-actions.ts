"use server";

import { revalidatePath } from "next/cache";

import { OutlookCalendarClient } from "@/infrastructure/integrations/outlook-calendar";
import { getOutlookAccessToken } from "@/infrastructure/integrations/outlook-calendar-session";
import { SupabaseStudyTaskRepository } from "@/infrastructure/supabase/planning/study-task-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

export async function createOutlookEventForTask(taskId: string) {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  const repository = new SupabaseStudyTaskRepository(supabase);
  const task = await repository.getById(taskId);

  if (!task || task.ownerId !== claims.sub) {
    throw new Error("STUDY_TASK_NOT_FOUND");
  }
  // A stale or replayed server action must not create an external calendar
  // event for a task that has already been completed or cancelled.
  if (task.status !== "pending") {
    throw new Error("STUDY_TASK_NOT_PENDING");
  }
  if (!task.dueAt) {
    throw new Error("STUDY_TASK_WITHOUT_SCHEDULE");
  }

  const start = new Date(task.dueAt);
  if (!Number.isFinite(start.getTime())) {
    throw new Error("STUDY_TASK_INVALID_SCHEDULE");
  }
  const end = new Date(start.getTime() + 50 * 60 * 1000);

  // Do not refresh or use a connected account's credentials before the
  // current user's task, lifecycle and schedule have been validated.
  const accessToken = await getOutlookAccessToken({ refresh: true });
  if (!accessToken) throw new Error("OUTLOOK_NOT_CONNECTED");

  const event = await new OutlookCalendarClient(accessToken).createEvent({
    subject: `Academia Arcana · ${task.title}`,
    start: start.toISOString(),
    end: end.toISOString(),
    body: "Sessão de estudo criada a partir do Cronograma da Academia Arcana.",
    reminderMinutesBeforeStart: 15,
    transactionId: task.id,
  });

  revalidatePath("/cronograma");
  return event;
}
