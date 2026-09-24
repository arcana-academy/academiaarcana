import type { SupabaseClient } from "@supabase/supabase-js";

import type { GamificationProfile } from "@/domains/gamification";
import type { StudyTask } from "@/domains/planning";

type CompleteStudyTaskRow = {
  task_id: string;
  task_owner_id: string;
  task_title: string;
  due_at: string | null;
  task_status: "pending" | "completed" | "cancelled";
  task_completed_at: string | null;
  task_created_at: string;
  task_updated_at: string;
  xp: number;
  streak_days: number;
  last_active_on: string | null;
  gamification_updated_at: string;
  mission_completed: boolean;
};

function toResult(row: CompleteStudyTaskRow) {
  const task: StudyTask = {
    id: row.task_id,
    ownerId: row.task_owner_id,
    title: row.task_title,
    dueAt: row.due_at,
    status: row.task_status,
    completedAt: row.task_completed_at,
    createdAt: row.task_created_at,
    updatedAt: row.task_updated_at,
  };

  const gamification: GamificationProfile = {
    ownerId: row.task_owner_id,
    xp: row.xp,
    streakDays: row.streak_days,
    lastActiveOn: row.last_active_on,
    updatedAt: row.gamification_updated_at,
  };

  return {
    task,
    gamification,
    missionCompleted: row.mission_completed,
  };
}

export class SupabaseStudyTaskRewardRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async completeWithReward(taskId: string) {
    const { data, error } = await this.supabase.rpc(
      "complete_study_task_with_reward",
      { p_task_id: taskId },
    );

    if (error) throw new Error(error.message);

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error("Tarefa não encontrada.");

    return toResult(row as CompleteStudyTaskRow);
  }
}
