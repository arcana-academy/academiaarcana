import { describe, expect, it } from "vitest";
import { getAchievements, getLevelForXp, getProgression } from "./progression";

const profile = {
  ownerId: "user-1",
  xp: 900,
  streakDays: 7,
  lastActiveOn: "2026-09-29",
  updatedAt: "2026-09-29T10:00:00.000Z",
};

describe("gamification progression", () => {
  it("derives deterministic levels from persisted XP", () => {
    expect(getLevelForXp(0)).toBe(1);
    expect(getLevelForXp(100)).toBe(2);
    expect(getLevelForXp(400)).toBe(3);
    expect(getLevelForXp(900)).toBe(4);
  });

  it("derives progression without inventing state", () => {
    const result = getProgression(profile, [
      { id: "m1", ownerId: "user-1", code: "a", title: "A", rewardXp: 10, targetDate: "2026-09-29", status: "completed", completedAt: "2026-09-29T09:00:00.000Z" },
      { id: "m2", ownerId: "user-1", code: "b", title: "B", rewardXp: 10, targetDate: "2026-09-29", status: "open", completedAt: null },
    ]);

    expect(result).toMatchObject({
      level: 4,
      totalXp: 900,
      streakDays: 7,
      completedMissionCount: 1,
    });
  });

  it("reports progress toward upcoming milestones from persisted counters", () => {
    const achievements = getAchievements(
      { ...profile, xp: 150, streakDays: 3 },
      [
        { id: "m1", ownerId: "user-1", code: "a", title: "A", rewardXp: 10, targetDate: "2026-10-07", status: "completed", completedAt: "2026-10-07T09:00:00.000Z" },
        { id: "m2", ownerId: "user-1", code: "b", title: "B", rewardXp: 10, targetDate: "2026-10-07", status: "open", completedAt: null },
      ],
    );

    expect(achievements).toMatchObject([
      { code: "first-xp", progress: { current: 10, target: 10, unit: "XP" } },
      { code: "level-3", progress: { current: 150, target: 400, unit: "XP" } },
      { code: "streak-7", progress: { current: 3, target: 7, unit: "dias" } },
      { code: "mission-3", description: "Concluir 3 missões de hoje.", progress: { current: 1, target: 3, unit: "missões de hoje" } },
    ]);
  });

  it("unlocks achievements only from persisted-derived thresholds", () => {
    const achievements = getAchievements(profile, []);
    expect(achievements.filter((item) => item.unlocked).map((item) => item.code)).toEqual([
      "first-xp",
      "level-3",
      "streak-7",
    ]);
  });
});
