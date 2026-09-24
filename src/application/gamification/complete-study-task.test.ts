import { describe, expect, it, vi } from "vitest";

import type { GamificationProfile } from "@/domains/gamification";
import type { StudyTask } from "@/domains/planning";

import {
  completeStudyTask,
  type CompleteStudyTaskResult,
  type StudyTaskRewardRepository,
} from "./complete-study-task";

const pendingTask: StudyTask = {
  id: "task-1",
  ownerId: "user-1",
  title: "Revisar capítulo",
  dueAt: null,
  status: "pending",
  completedAt: null,
  createdAt: "2026-09-24T10:00:00.000Z",
  updatedAt: "2026-09-24T10:00:00.000Z",
};

const completedTask: StudyTask = {
  ...pendingTask,
  status: "completed",
  completedAt: "2026-09-24T11:00:00.000Z",
  updatedAt: "2026-09-24T11:00:00.000Z",
};

const profile: GamificationProfile = {
  ownerId: "user-1",
  xp: 30,
  streakDays: 3,
  lastActiveOn: "2026-09-24",
  updatedAt: "2026-09-24T11:00:00.000Z",
};

const atomicResult: CompleteStudyTaskResult = {
  task: completedTask,
  gamification: profile,
  missionCompleted: true,
};

describe("completeStudyTask", () => {
  it("returns the atomic database result for the authenticated owner", async () => {
    const repository: StudyTaskRewardRepository = {
      completeWithReward: vi.fn().mockResolvedValue(atomicResult),
    };

    const result = await completeStudyTask(repository, "user-1", "task-1");

    expect(result).toEqual(atomicResult);
    expect(repository.completeWithReward).toHaveBeenCalledWith("task-1");
  });

  it("rejects a result that is not owned by the authenticated user", async () => {
    const repository: StudyTaskRewardRepository = {
      completeWithReward: vi.fn().mockResolvedValue({
        ...atomicResult,
        task: { ...completedTask, ownerId: "another-user" },
      }),
    };

    await expect(
      completeStudyTask(repository, "user-1", "task-1"),
    ).rejects.toThrow("Tarefa não encontrada.");
  });

  it("preserves an idempotent no-reward result", async () => {
    const repository: StudyTaskRewardRepository = {
      completeWithReward: vi.fn().mockResolvedValue({
        ...atomicResult,
        missionCompleted: false,
      }),
    };

    const result = await completeStudyTask(repository, "user-1", "task-1");

    expect(result.missionCompleted).toBe(false);
  });
});
