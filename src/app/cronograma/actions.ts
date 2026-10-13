"use server";

import type { StudyTask } from "@/domains/planning";
import { StudyTaskService } from "@/application/planning/study-tasks";
import { completeStudyTask } from "@/application/gamification/complete-study-task";
import { SupabaseStudyTaskRepository } from "@/infrastructure/supabase/planning/study-task-repository";
import { SupabaseStudyTaskRewardRepository } from "@/infrastructure/supabase/gamification/study-task-reward-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import { revalidateLearningViews } from "@/lib/learning/revalidate-learning-views";

type CreateInput = {
  title: string;
  dueAt: string | null;
};

export async function createStudyTask(input: CreateInput): Promise<StudyTask> {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();

  const service = new StudyTaskService(new SupabaseStudyTaskRepository(supabase));

  const task = await service.create({
    ownerId: claims.sub,
    title: input.title,
    dueAt: input.dueAt,
  });
  revalidateLearningViews("study-task-created");
  return task;
}

export async function completeStudyTaskAction(id: string): Promise<StudyTask> {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();

  const rewardRepository = new SupabaseStudyTaskRewardRepository(supabase);
  const result = await completeStudyTask(rewardRepository, claims.sub, id);
  revalidateLearningViews("study-task-completed");

  return result.task;
}
