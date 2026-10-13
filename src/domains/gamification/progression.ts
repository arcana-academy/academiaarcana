import type { GamificationProfile, Mission } from "./contracts";

export type GamificationProgression = {
  level: number;
  levelProgressXp: number;
  nextLevelXp: number;
  totalXp: number;
  streakDays: number;
  completedMissionCount: number;
};

export type Achievement = {
  code: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: {
    current: number;
    target: number;
    unit: string;
  };
};

/**
 * Defensive read-side boundary for integer counters persisted by gamification.
 * Invalid values must never create a level, achievement or non-finite UI progress.
 * This function does not change the stored counter or grant any reward.
 */
function safePersistedCounter(value: number): number {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

export function getLevelForXp(xp: number): number {
  const safeXp = safePersistedCounter(xp);
  return Math.floor(Math.sqrt(safeXp / 100)) + 1;
}

export function getProgression(
  profile: GamificationProfile | null,
  missions: readonly Mission[],
): GamificationProgression {
  const totalXp = safePersistedCounter(profile?.xp ?? 0);
  const level = getLevelForXp(totalXp);
  const currentLevelBaseXp = (level - 1) ** 2 * 100;
  const nextLevelXp = level ** 2 * 100;

  return {
    level,
    levelProgressXp: totalXp - currentLevelBaseXp,
    nextLevelXp,
    totalXp,
    streakDays: safePersistedCounter(profile?.streakDays ?? 0),
    completedMissionCount: missions.filter((mission) => mission.status === "completed").length,
  };
}

export function getAchievements(
  profile: GamificationProfile | null,
  missions: readonly Mission[],
): Achievement[] {
  const progression = getProgression(profile, missions);

  return [
    {
      code: "first-xp",
      title: "Primeiro passo",
      description: "Alcançar os primeiros 10 XP.",
      unlocked: progression.totalXp >= 10,
      progress: { current: Math.min(progression.totalXp, 10), target: 10, unit: "XP" },
    },
    {
      code: "level-3",
      title: "Aprendiz Arcano",
      description: "Alcançar o nível 3.",
      unlocked: progression.level >= 3,
      progress: { current: Math.min(progression.totalXp, 400), target: 400, unit: "XP" },
    },
    {
      code: "streak-7",
      title: "Constância",
      description: "Manter 7 dias de continuidade de estudo.",
      unlocked: progression.streakDays >= 7,
      progress: { current: Math.min(progression.streakDays, 7), target: 7, unit: "dias" },
    },
    {
      code: "mission-3",
      title: "Guardião das Missões",
      description: "Concluir 3 missões de hoje.",
      unlocked: progression.completedMissionCount >= 3,
      progress: { current: Math.min(progression.completedMissionCount, 3), target: 3, unit: "missões de hoje" },
    },
  ];
}
