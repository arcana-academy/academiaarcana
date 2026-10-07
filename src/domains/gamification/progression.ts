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

export function getLevelForXp(xp: number): number {
  const safeXp = Math.max(0, Math.floor(xp));
  return Math.floor(Math.sqrt(safeXp / 100)) + 1;
}

export function getProgression(
  profile: GamificationProfile | null,
  missions: readonly Mission[],
): GamificationProgression {
  const totalXp = Math.max(0, profile?.xp ?? 0);
  const level = getLevelForXp(totalXp);
  const currentLevelBaseXp = (level - 1) ** 2 * 100;
  const nextLevelXp = level ** 2 * 100;

  return {
    level,
    levelProgressXp: totalXp - currentLevelBaseXp,
    nextLevelXp,
    totalXp,
    streakDays: Math.max(0, profile?.streakDays ?? 0),
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
