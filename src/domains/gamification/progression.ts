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
 * Gamification counts represent whole, nonnegative persisted values.
 * Invalid or unrepresentable data must not leak NaN/Infinity to the UI.
 */
function safeCounter(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(value)));
}

/**
 * Return a level starting at one, with level n reached at 100 * (n - 1)^2 XP.
 * Non-finite XP becomes zero; finite XP is floored and clamped to the safe
 * nonnegative integer range before calculating the level.
 */
export function getLevelForXp(xp: number): number {
  const safeXp = safeCounter(xp);
  return Math.floor(Math.sqrt(safeXp / 100)) + 1;
}

/**
 * Derive level progress and completed mission counts from the supplied records.
 * XP and streak days are floored and clamped to safe nonnegative integers;
 * non-finite or missing counters become zero. A null profile starts at level one.
 * levelProgressXp is XP earned within the level; nextLevelXp is the total XP
 * threshold for the next level. Missions are not filtered by owner or date.
 */
export function getProgression(
  profile: GamificationProfile | null,
  missions: readonly Mission[],
): GamificationProgression {
  const totalXp = safeCounter(profile?.xp ?? 0);
  const level = getLevelForXp(totalXp);
  const currentLevelBaseXp = (level - 1) ** 2 * 100;
  const nextLevelXp = level ** 2 * 100;

  return {
    level,
    levelProgressXp: totalXp - currentLevelBaseXp,
    nextLevelXp,
    totalXp,
    streakDays: safeCounter(profile?.streakDays ?? 0),
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
