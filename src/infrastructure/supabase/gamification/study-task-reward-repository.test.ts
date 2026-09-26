import { describe, expect, it, vi } from "vitest";

import { SupabaseStudyTaskRewardRepository } from "./study-task-reward-repository";

describe("SupabaseStudyTaskRewardRepository", () => {
  it("calls the atomic RPC without trusting an owner or client timestamp", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          task_id: "task-1",
          task_owner_id: "user-1",
          task_title: "Revisar capítulo",
          due_at: null,
          task_status: "completed",
          task_completed_at: "2026-09-24T11:00:00.000Z",
          task_created_at: "2026-09-24T10:00:00.000Z",
          task_updated_at: "2026-09-24T11:00:00.000Z",
          xp: 30,
          streak_days: 3,
          last_active_on: "2026-09-24",
          gamification_updated_at: "2026-09-24T11:00:00.000Z",
          mission_completed: true,
        },
      ],
      error: null,
    });

    const repository = new SupabaseStudyTaskRewardRepository({ rpc } as never);

    const result = await repository.completeWithReward("task-1");

    expect(rpc).toHaveBeenCalledWith("complete_study_task_with_reward", {
      p_task_id: "task-1",
    });
    expect(result.task.id).toBe("task-1");
    expect(result.task.ownerId).toBe("user-1");
    expect(result.gamification.xp).toBe(30);
    expect(result.missionCompleted).toBe(true);
  });

  it("fails when the RPC returns no row", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    const repository = new SupabaseStudyTaskRewardRepository({ rpc } as never);

    await expect(repository.completeWithReward("missing")).rejects.toThrow(
      "Tarefa não encontrada.",
    );
  });

  it("propagates database errors", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "rpc failed" },
    });

    const repository = new SupabaseStudyTaskRewardRepository({ rpc } as never);

    await expect(repository.completeWithReward("task-1")).rejects.toThrow(
      "rpc failed",
    );
  });
});
