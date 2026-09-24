import { describe, expect, it, vi } from "vitest";

import type {
  GamificationProfile,
  GamificationRepository,
} from "@/domains/gamification";
import type { StudyTask, StudyTaskRepository } from "@/domains/planning";

import { completeStudyTask } from "./complete-study-task";

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

const profile: GamificationProfile = {
  ownerId: "user-1",
  xp: 20,
  streakDays: 2,
  lastActiveOn: "2026-09-23",
  updatedAt: "2026-09-24T10:00:00.000Z",
};

describe("completeStudyTask", () => {
  it("awards the daily mission only once for the successful completion", async () => {
    const completedTask = {
      ...pendingTask,
      status: "completed" as const,
      completedAt: "2026-09-24T11:00:00.000Z",
      updatedAt: "2026-09-24T11:00:00.000Z",
    };

    const taskRepository: StudyTaskRepository = {
      create: vi.fn(),
      listUpcoming: vi.fn(),
      getById: vi.fn().mockResolvedValue(pendingTask),
      complete: vi.fn().mockResolvedValue(completedTask),
    };

    const mission = {
      id: "mission-1",
      ownerId: "user-1",
      code: "complete-study-task",
      title: "Concluir uma tarefa de estudo",
      rewardXp: 10,
      targetDate: "2026-09-24",
      status: "open" as const,
      completedAt: null,
    };

    const gamificationRepository: GamificationRepository = {
      getProfile: vi.fn().mockResolvedValue(profile),
      ensureDailyMission: vi.fn().mockResolvedValue(mission),
      listDailyMissions: vi.fn(),
      completeMission: vi.fn().mockResolvedValue({
        ...mission,
        status: "completed" as const,
        completedAt: "2026-09-24T11:00:00.000Z",
      }),
      addXp: vi.fn().mockResolvedValue({
        ...profile,
        xp: 30,
        streakDays: 3,
      }),
    };

    const result = await completeStudyTask(
      taskRepository,
      gamificationRepository,
      "user-1",
      "task-1",
      new Date("2026-09-24T11:00:00.000Z"),
    );

    expect(result.task.status).toBe("completed");
    expect(result.missionCompleted).toBe(true);
    expect(gamificationRepository.completeMission).toHaveBeenCalledTimes(1);
    expect(gamificationRepository.addXp).toHaveBeenCalledWith(
      "user-1",
      10,
      "2026-09-24",
    );
  });

  it("does not award XP when a concurrent request already completed the task", async () => {
    const alreadyCompleted = {
      ...pendingTask,
      status: "completed" as const,
      completedAt: "2026-09-24T10:30:00.000Z",
    };

    const taskRepository: StudyTaskRepository = {
      create: vi.fn(),
      listUpcoming: vi.fn(),
      getById: vi
        .fn()
        .mockResolvedValueOnce(pendingTask)
        .mockResolvedValueOnce(alreadyCompleted),
      complete: vi.fn().mockResolvedValue(null),
    };

    const gamificationRepository: GamificationRepository = {
      getProfile: vi.fn().mockResolvedValue(profile),
      ensureDailyMission: vi.fn(),
      listDailyMissions: vi.fn(),
      completeMission: vi.fn(),
      addXp: vi.fn(),
    };

    const result = await completeStudyTask(
      taskRepository,
      gamificationRepository,
      "user-1",
      "task-1",
      new Date("2026-09-24T11:00:00.000Z"),
    );

    expect(result.task.status).toBe("completed");
    expect(result.missionCompleted).toBe(false);
    expect(gamificationRepository.addXp).not.toHaveBeenCalled();
    expect(gamificationRepository.completeMission).not.toHaveBeenCalled();
  });
});
