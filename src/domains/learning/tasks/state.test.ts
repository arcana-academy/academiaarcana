import { describe, expect, it } from "vitest";
import {
  canTransitionTaskStatus,
  getTaskStatusLabel,
  getTaskStatusSymbol,
} from "./state";
import type { TaskPriority, TaskStatus } from "./types";

describe("learning task state", () => {
  const statuses: TaskStatus[] = [
    "todo",
    "in_progress",
    "done",
    "cancelled",
    "scheduled",
    "blocked",
    "question",
    "idea",
  ];

  it("provides a Portuguese label and stable symbol for every status", () => {
    for (const status of statuses) {
      expect(getTaskStatusLabel(status)).toBeTruthy();
      expect(getTaskStatusSymbol(status)).toBeTruthy();
    }
  });

  it("allows expected task progress transitions", () => {
    expect(canTransitionTaskStatus("todo", "in_progress")).toBe(true);
    expect(canTransitionTaskStatus("in_progress", "done")).toBe(true);
    expect(canTransitionTaskStatus("scheduled", "in_progress")).toBe(true);
    expect(canTransitionTaskStatus("blocked", "in_progress")).toBe(true);
    expect(canTransitionTaskStatus("question", "in_progress")).toBe(true);
  });

  it("allows recovery and cancellation without making terminal states immutable", () => {
    expect(canTransitionTaskStatus("done", "todo")).toBe(true);
    expect(canTransitionTaskStatus("cancelled", "todo")).toBe(true);
    expect(canTransitionTaskStatus("in_progress", "cancelled")).toBe(true);
  });

  it("rejects nonsensical direct transitions", () => {
    expect(canTransitionTaskStatus("todo", "done")).toBe(false);
    expect(canTransitionTaskStatus("idea", "done")).toBe(false);
    expect(canTransitionTaskStatus("question", "cancelled")).toBe(false);
  });

  it("keeps priority independent from status", () => {
    const priorities: TaskPriority[] = ["low", "normal", "high", "urgent"];
    expect(priorities).toHaveLength(4);
    expect(statuses).toHaveLength(8);
  });
});
