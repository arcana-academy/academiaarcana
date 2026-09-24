/**
 * Gamification domain contracts.
 *
 * Gamification owns recognition state and missions. Mutation is idempotent
 * at the mission level so retries do not award the same mission twice.
 */

export type GamificationProfile = {
  ownerId: string;
  xp: number;
  streakDays: number;
  lastActiveOn: string | null;
  updatedAt: string;
};

export type MissionStatus = "open" | "completed";

export type Mission = {
  id: string;
  ownerId: string;
  code: string;
  title: string;
  rewardXp: number;
  targetDate: string;
  status: MissionStatus;
  completedAt: string | null;
};

export interface GamificationRepository {
  getProfile(ownerId: string): Promise<GamificationProfile>;
  ensureDailyMission(
    ownerId: string,
    code: string,
    targetDate: string,
    title: string,
    rewardXp: number,
  ): Promise<Mission>;
  listDailyMissions(ownerId: string, targetDate: string): Promise<Mission[]>;
  completeMission(id: string, completedAt: string): Promise<Mission | null>;
  addXp(ownerId: string, amount: number, activeOn: string): Promise<GamificationProfile>;
}
