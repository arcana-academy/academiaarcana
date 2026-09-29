"use server";

import { revalidatePath } from "next/cache";

import { OutlookCalendarClient } from "@/infrastructure/integrations/outlook-calendar";
import { getOutlookAccessToken } from "@/infrastructure/integrations/outlook-calendar-session";
import { SupabaseStudyTaskRepository } from "@/infrastructure/supabase/planning/study-task-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

export async function createOutlookEventForTask(taskId: string) {
  const claims = await requireAuthenticatedUser();
  const accessToken = await getOutlookAccessToken();
  if (!accessToken) throw new Error("OUTLOOK_NOT_CONNECTED");

  const supabase = await createClient();
  const repository = new SupabaseStudyTaskRepository(supabase);
  const task = await repository.getById(taskId);

  if (!task || task.ownerId !== claims.sub) {
    throw new Error("STUDY_TASK_NOT_FOUND");
  }
  if (!task.dueAt) {
    throw new Error("STUDY_TASK_WITHOUT_SCHEDULE");
  }

  const start = new Date(task.dueAt);
  const end = new Date(start.getTime() + 50 * 60 * 1000);

  const event = await new OutlookCalendarClient(accessToken).createEvent({
    subject: `Academia Arcana · ${task.title}`,
    start: start.toISOString(),
    end: end.toISOString(),
    body: "Sessão de estudo criada a partir do Cronograma da Academia Arcana.",
    reminderMinutesBeforeStart: 15,
  });

  revalidatePath("/cronograma");
  return event;
}
