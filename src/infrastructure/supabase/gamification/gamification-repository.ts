import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  GamificationRepository,
  Mission,
} from "@/domains/gamification";

type MissionRow = {
  id: string;
  owner_id: string;
  code: string;
  title: string;
  reward_xp: number;
  target_date: string;
  completed_at: string | null;
};

function toMission(row: MissionRow): Mission {
  return {
    id: row.id,
    ownerId: row.owner_id,
    code: row.code,
    title: row.title,
    rewardXp: row.reward_xp,
    targetDate: row.target_date,
    status: row.completed_at ? "completed" : "open",
    completedAt: row.completed_at,
  };
}

export class SupabaseGamificationRepository implements GamificationRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listDailyMissions(
    ownerId: string,
    targetDate: string,
  ): Promise<Mission[]> {
    const { data, error } = await this.supabase
      .from("missions")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("target_date", targetDate)
      .order("id", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => toMission(row as MissionRow));
  }
}
