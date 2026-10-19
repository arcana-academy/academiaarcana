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

  it("rejects non-finite XP before computing levels", () => {
    expect(getLevelForXp(Number.NaN)).toBe(1);
    expect(getLevelForXp(Number.POSITIVE_INFINITY)).toBe(1);
    expect(getLevelForXp(Number.NEGATIVE_INFINITY)).toBe(1);
    expect(getLevelForXp(-100)).toBe(1);
  });

  it("keeps corrupted persisted counters out of statistics", () => {
    expect(getProgression({ ...profile, xp: Number.NaN, streakDays: Number.POSITIVE_INFINITY }, [])).toMatchObject({
      level: 1,
      totalXp: 0,
      levelProgressXp: 0,
      nextLevelXp: 100,
      streakDays: 0,
      completedMissionCount: 0,
    });
  });

  it("does not fabricate achievements from non-finite XP or streaks", () => {
    const achievements = getAchievements(
      { ...profile, xp: Number.POSITIVE_INFINITY, streakDays: Number.NaN },
      [],
    );
    expect(achievements.every((item) => !item.unlocked)).toBe(true);
    expect(achievements.map((item) => item.progress.current)).toEqual([0, 0, 0, 0]);
  });

  it("normalizes fractional and out-of-range counters to safe whole values", () => {
    expect(getProgression({ ...profile, xp: 150.9, streakDays: 2.8 }, [])).toMatchObject({
      level: 2,
      totalXp: 150,
      levelProgressXp: 50,
      streakDays: 2,
    });

    const huge = getProgression({ ...profile, xp: Number.MAX_VALUE }, []);
    expect(huge.totalXp).toBe(Number.MAX_SAFE_INTEGER);
    expect(Number.isFinite(huge.nextLevelXp)).toBe(true);
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

  it.each([
    [9.99, 1, 9],
    [99.99, 1, 99],
    [100, 2, 0],
    [399.99, 2, 299],
    [400, 3, 0],
  ])("normalizes %s XP consistently at a level boundary", (xp, level, levelProgressXp) => {
    expect(getLevelForXp(xp)).toBe(level);
    expect(getProgression({ ...profile, xp }, [])).toMatchObject({
      level, totalXp: Math.floor(xp), levelProgressXp,
    });
  });

  it.each([Number.NaN, Infinity, -Infinity, -1, -0.5])(
    "does not unlock XP or streak achievements from invalid counter %s",
    (value) => {
      const corrupted = { ...profile, xp: value, streakDays: value };
      expect(getProgression(corrupted, [])).toEqual(getProgression(null, []));
      expect(getAchievements(corrupted, [])).toEqual(getAchievements(null, []));
    },
  );

  it("caps huge finite counters while keeping progress within its level and achievement bounds", () => {
    const huge = { ...profile, xp: Number.MAX_VALUE, streakDays: Number.MAX_VALUE };
    const progression = getProgression(huge, []);
    expect(progression).toMatchObject({
      totalXp: Number.MAX_SAFE_INTEGER, streakDays: Number.MAX_SAFE_INTEGER,
    });
    expect(progression.levelProgressXp).toBeGreaterThanOrEqual(0);
    expect(progression.levelProgressXp).toBeLessThan(
      progression.nextLevelXp - (progression.level - 1) ** 2 * 100,
    );
    expect(getAchievements(huge, []).map(({ progress }) => progress.current))
      .toEqual([10, 400, 7, 0]);
  });
});
