import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  GamificationProfile,
  GamificationRepository,
  Mission,
} from "@/domains/gamification";

type ProfileRow = {
  owner_id: string;
  xp: number;
  streak_days: number;
  last_active_on: string | null;
  updated_at: string;
};

type MissionRow = {
  id: string;
  owner_id: string;
  code: string;
  title: string;
  reward_xp: number;
  target_date: string;
  completed_at: string | null;
};

function toProfile(row: ProfileRow): GamificationProfile {
  return {
    ownerId: row.owner_id,
    xp: row.xp,
    streakDays: row.streak_days,
    lastActiveOn: row.last_active_on,
    updatedAt: row.updated_at,
  };
}

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

  async getProfile(ownerId: string): Promise<GamificationProfile> {
    const { data, error } = await this.supabase
      .from("gamification_profiles")
      .select("*")
      .eq("owner_id", ownerId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!data) {
      const now = new Date().toISOString();
      const created = await this.supabase
        .from("gamification_profiles")
        .insert({
          owner_id: ownerId,
          xp: 0,
          streak_days: 0,
          last_active_on: null,
          updated_at: now,
        })
        .select("*")
        .single();

      if (created.error) throw new Error(created.error.message);
      return toProfile(created.data as ProfileRow);
    }

    return toProfile(data as ProfileRow);
  }

  async ensureDailyMission(
    ownerId: string,
    code: string,
    targetDate: string,
    title: string,
    rewardXp: number,
  ): Promise<Mission> {
    const { data, error } = await this.supabase
      .from("missions")
      .upsert(
        {
          owner_id: ownerId,
          code,
          target_date: targetDate,
          title,
          reward_xp: rewardXp,
        },
        { onConflict: "owner_id,code,target_date", ignoreDuplicates: true },
      )
      .select("*")
      .single();

    if (error) {
      const existing = await this.supabase
        .from("missions")
        .select("*")
        .eq("owner_id", ownerId)
        .eq("code", code)
        .eq("target_date", targetDate)
        .single();

      if (existing.error) throw new Error(error.message);
      return toMission(existing.data as MissionRow);
    }

    return toMission(data as MissionRow);
  }

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

  async completeMission(
    id: string,
    completedAt: string,
  ): Promise<Mission | null> {
    const { data, error } = await this.supabase
      .from("missions")
      .update({ completed_at: completedAt })
      .eq("id", id)
      .is("completed_at", null)
      .select("*")
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? toMission(data as MissionRow) : null;
  }

  async addXp(
    ownerId: string,
    amount: number,
    activeOn: string,
  ): Promise<GamificationProfile> {
    const current = await this.getProfile(ownerId);
    let streakDays = current.streakDays;

    if (current.lastActiveOn === activeOn) {
      streakDays = current.streakDays;
    } else if (current.lastActiveOn) {
      const previous = new Date(`${current.lastActiveOn}T00:00:00Z`);
      const currentDay = new Date(`${activeOn}T00:00:00Z`);
      const elapsedDays = Math.round(
        (currentDay.getTime() - previous.getTime()) / 86_400_000,
      );
      streakDays = elapsedDays === 1 ? current.streakDays + 1 : 1;
    } else {
      streakDays = 1;
    }

    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .from("gamification_profiles")
      .update({
        xp: current.xp + amount,
        streak_days: streakDays,
        last_active_on: activeOn,
        updated_at: now,
      })
      .eq("owner_id", ownerId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return toProfile(data as ProfileRow);
  }
}
