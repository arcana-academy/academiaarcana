import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StudyTask } from "@/domains/planning";

const mocks = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  createClient: vi.fn(),
  create: vi.fn(),
  completeStudyTask: vi.fn(),
  revalidateLearningViews: vi.fn(),
}));

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: mocks.requireAuthenticatedUser,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));
vi.mock("@/lib/learning/revalidate-learning-views", () => ({
  revalidateLearningViews: mocks.revalidateLearningViews,
}));
vi.mock("@/application/planning/study-tasks", () => ({
  StudyTaskService: class {
    create = mocks.create;
  },
}));
vi.mock("@/infrastructure/supabase/planning/study-task-repository", () => ({
  SupabaseStudyTaskRepository: class {},
}));
vi.mock("@/application/gamification/complete-study-task", () => ({
  completeStudyTask: mocks.completeStudyTask,
}));
vi.mock("@/infrastructure/supabase/gamification/study-task-reward-repository", () => ({
  SupabaseStudyTaskRewardRepository: class {},
}));

import { completeStudyTaskAction, createStudyTask } from "./actions";

const pending: StudyTask = {
  id: "task-synthetic",
  ownerId: "learner-synthetic",
  title: "Revisar Página 1",
  dueAt: null,
  status: "pending",
  completedAt: null,
  createdAt: "2026-10-13T10:00:00.000Z",
  updatedAt: "2026-10-13T10:00:00.000Z",
};

const completed: StudyTask = {
  ...pending,
  status: "completed",
  completedAt: "2026-10-13T10:30:00.000Z",
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireAuthenticatedUser.mockResolvedValue({ sub: "learner-synthetic" });
  mocks.createClient.mockResolvedValue({});
});

describe("Cronograma to Missions atomic contract", () => {
  it("creates a study task, then refreshes only scheduling projections", async () => {
    mocks.create.mockResolvedValue(pending);

    await expect(createStudyTask({ title: "Revisar Página 1", dueAt: null })).resolves.toEqual(pending);

    expect(mocks.create).toHaveBeenCalledWith({
      ownerId: "learner-synthetic",
      title: "Revisar Página 1",
      dueAt: null,
    });
    expect(mocks.revalidateLearningViews).toHaveBeenCalledExactlyOnceWith("study-task-created");
    expect(mocks.completeStudyTask).not.toHaveBeenCalled();
  });

  it("refreshes mission and planning projections only after the atomic reward returns", async () => {
    mocks.completeStudyTask.mockResolvedValue({
      task: completed,
      gamification: { ownerId: "learner-synthetic", xp: 20 },
      missionCompleted: true,
    });

    await expect(completeStudyTaskAction(pending.id)).resolves.toEqual(completed);

    expect(mocks.completeStudyTask).toHaveBeenCalledWith(
      expect.anything(),
      "learner-synthetic",
      pending.id,
    );
    expect(mocks.revalidateLearningViews).toHaveBeenCalledExactlyOnceWith("study-task-completed");
  });

  it("preserves idempotent no-new-mission returns without awarding extra XP", async () => {
    mocks.completeStudyTask.mockResolvedValue({
      task: completed,
      gamification: { ownerId: "learner-synthetic", xp: 20 },
      missionCompleted: false,
    });

    await expect(completeStudyTaskAction(pending.id)).resolves.toEqual(completed);

    expect(mocks.completeStudyTask).toHaveBeenCalledTimes(1);
    expect(mocks.revalidateLearningViews).toHaveBeenCalledWith("study-task-completed");
  });

  it("does not refresh completed mission state if the atomic operation rejects", async () => {
    const error = new Error("atomic task reward unavailable");
    mocks.completeStudyTask.mockRejectedValue(error);

    await expect(completeStudyTaskAction(pending.id)).rejects.toBe(error);

    expect(mocks.revalidateLearningViews).not.toHaveBeenCalled();
  });

  it("does not open a repository or refresh any view when authentication fails", async () => {
    const error = new Error("not authenticated");
    mocks.requireAuthenticatedUser.mockRejectedValue(error);

    await expect(completeStudyTaskAction(pending.id)).rejects.toBe(error);
    await expect(createStudyTask({ title: pending.title, dueAt: null })).rejects.toBe(error);

    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.completeStudyTask).not.toHaveBeenCalled();
    expect(mocks.revalidateLearningViews).not.toHaveBeenCalled();
  });

  it("does not refresh the schedule when task creation rejects", async () => {
    mocks.create.mockRejectedValue(new Error("task not persisted"));

    await expect(createStudyTask({ title: pending.title, dueAt: null })).rejects.toThrow("task not persisted");
    expect(mocks.revalidateLearningViews).not.toHaveBeenCalled();
  });
});
