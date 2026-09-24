"use server";

import type { StudyTask } from "@/domains/planning";
import { StudyTaskService } from "@/application/planning/study-tasks";
import { completeStudyTask } from "@/application/gamification/complete-study-task";
import { SupabaseStudyTaskRepository } from "@/infrastructure/supabase/planning/study-task-repository";
import { SupabaseGamificationRepository } from "@/infrastructure/supabase/gamification/gamification-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

type CreateInput = {
  title: string;
  dueAt: string | null;
};

export async function createStudyTask(input: CreateInput): Promise<StudyTask> {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();

  const service = new StudyTaskService(new SupabaseStudyTaskRepository(supabase));

  return service.create({
    ownerId: claims.sub,
    title: input.title,
    dueAt: input.dueAt,
  });
}

export async function completeStudyTaskAction(id: string): Promise<StudyTask> {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();

  const taskRepository = new SupabaseStudyTaskRepository(supabase);
  const gamificationRepository = new SupabaseGamificationRepository(supabase);

  const result = await completeStudyTask(
    taskRepository,
    gamificationRepository,
    claims.sub,
    id,
  );

  return result.task;
}
