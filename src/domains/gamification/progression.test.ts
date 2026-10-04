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

  it("unlocks achievements only from persisted-derived thresholds", () => {
    const achievements = getAchievements(profile, []);
    expect(achievements.filter((item) => item.unlocked).map((item) => item.code)).toEqual([
      "first-xp",
      "level-3",
      "streak-7",
    ]);
  });
});
