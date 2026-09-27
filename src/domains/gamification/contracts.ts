/**
 * Gamification domain contracts.
 *
 * Gamification owns read-side recognition state. Mutations that can award
 * XP or complete rewards are intentionally exposed through one atomic
 * application/infrastructure boundary.
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
  listDailyMissions(ownerId: string, targetDate: string): Promise<Mission[]>;
}
