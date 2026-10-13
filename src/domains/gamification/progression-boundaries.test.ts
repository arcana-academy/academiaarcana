import { describe, expect, it } from "vitest";
import { getAchievements, getLevelForXp, getProgression } from "./progression";

const profile = {
  ownerId: "synthetic-user",
  xp: 900,
  streakDays: 7,
  lastActiveOn: null,
  updatedAt: "2026-10-13T00:00:00.000Z",
};

describe("gamification read-side counter boundaries", () => {
  it.each([
    ["NaN", Number.NaN],
    ["positive infinity", Number.POSITIVE_INFINITY],
    ["negative infinity", Number.NEGATIVE_INFINITY],
    ["negative values", -10],
    ["fractional XP", 10.5],
    ["unsafe integer", Number.MAX_SAFE_INTEGER + 1],
  ])("does not invent levels from %s", (_label, value) => {
    expect(getLevelForXp(value)).toBe(1);
  });

  it("preserves valid integer levels and XP thresholds", () => {
    expect(getLevelForXp(0)).toBe(1);
    expect(getLevelForXp(99)).toBe(1);
    expect(getLevelForXp(100)).toBe(2);
    expect(getLevelForXp(400)).toBe(3);
    expect(getProgression(profile, [])).toMatchObject({
      level: 4,
      totalXp: 900,
      levelProgressXp: 0,
      nextLevelXp: 1600,
      streakDays: 7,
    });
  });

  it("returns only finite, nonnegative read projections when counters are invalid", () => {
    const result = getProgression(
      { ...profile, xp: Number.NaN, streakDays: Number.POSITIVE_INFINITY },
      [],
    );
    expect(result).toMatchObject({
      totalXp: 0,
      level: 1,
      levelProgressXp: 0,
      nextLevelXp: 100,
      streakDays: 0,
      completedMissionCount: 0,
    });
    expect(Object.values(result).every(Number.isFinite)).toBe(true);
  });

  it("does not unlock achievements from corrupt persisted XP or streak", () => {
    const achievements = getAchievements(
      { ...profile, xp: Number.POSITIVE_INFINITY, streakDays: Number.NaN },
      [],
    );
    expect(achievements.every((item) => !item.unlocked)).toBe(true);
    expect(achievements.every((item) =>
      Number.isFinite(item.progress.current) &&
      item.progress.current >= 0 &&
      item.progress.current <= item.progress.target,
    )).toBe(true);
  });
});
