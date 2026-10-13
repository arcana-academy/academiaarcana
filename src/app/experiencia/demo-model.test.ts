import { describe, expect, it } from "vitest";
import {
  INITIAL_MISSIONS,
  addDemoMission,
  cleanMissionTitle,
  getDemoProgress,
  readDemoSnapshot,
  toggleDemoMission,
} from "./demo-model";

describe("isolated MVP experience model", () => {
  it("starts with a usable example journey", () => {
    const snapshot = readDemoSnapshot(null);
    expect(snapshot.missions).toHaveLength(3);
    expect(snapshot.focusSessions).toBe(0);
    expect(getDemoProgress(snapshot.missions, 0).percent).toBe(0);
  });

  it("adds only named missions within the eight mission bound", () => {
    expect(addDemoMission(INITIAL_MISSIONS, "  ", "new")).toBe(INITIAL_MISSIONS);
    const next = addDemoMission(INITIAL_MISSIONS, "  Revisar   capítulo  ", "new");
    expect(next.at(-1)).toEqual({ id: "new", title: "Revisar capítulo", done: false });
    expect(addDemoMission(next, "Duplicado", "new")).toBe(next);
    expect(addDemoMission(Array(8).fill(next[0]), "Nona", "nona")).toHaveLength(8);
    expect(cleanMissionTitle(" a ".repeat(100)).length).toBeLessThanOrEqual(80);
  });

  it("toggles real completion and recalculates progress and XP", () => {
    const done = toggleDemoMission(INITIAL_MISSIONS, "explorar");
    expect(done[0].done).toBe(true);
    expect(getDemoProgress(done, 1)).toEqual({
      completed: 1, total: 3, percent: 33, xp: 55,
    });
    expect(toggleDemoMission(done, "explorar")[0].done).toBe(false);
  });

  it("accepts valid local data without cloud access", () => {
    const snapshot = readDemoSnapshot(JSON.stringify({
      missions: [{ id: "one", title: "Revisar", done: true }],
      focusSessions: 2,
    }));
    expect(getDemoProgress(snapshot.missions, snapshot.focusSessions).xp).toBe(75);
  });

  it("rejects malformed, excessive and duplicate persisted data", () => {
    expect(readDemoSnapshot("{invalid").missions).toHaveLength(3);
    expect(readDemoSnapshot(JSON.stringify({ missions: [{ id: "a", title: "X" }] })).missions).toHaveLength(3);
    expect(readDemoSnapshot(JSON.stringify({ missions: Array(9).fill({ id: "x", title: "X", done: false }) })).missions).toHaveLength(3);
    expect(readDemoSnapshot(JSON.stringify({ missions: [{ id: "x", title: "X", done: false }, { id: "x", title: "Y", done: true }] })).missions).toHaveLength(3);
    expect(readDemoSnapshot(JSON.stringify({ missions: [], focusSessions: -4 })).focusSessions).toBe(0);
  });
});
