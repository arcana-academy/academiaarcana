import { describe, expect, it, vi } from "vitest";

import type { StudyTaskRepository } from "@/domains/planning";

import { StudyTaskService } from "./study-tasks";

describe("StudyTaskService", () => {
  it("rejects an empty title", async () => {
    const repository: StudyTaskRepository = {
      create: vi.fn(),
      listUpcoming: vi.fn(),
      getById: vi.fn(),
    };

    const service = new StudyTaskService(repository);

    await expect(
      service.create({ ownerId: "user-1", title: "   " }),
    ).rejects.toThrow("O título da tarefa é obrigatório.");
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("creates a pending study task with a stable domain shape", async () => {
    const created = {
      id: "task-1",
      ownerId: "user-1",
      title: "Revisar capítulo 2",
      dueAt: null,
      status: "pending" as const,
      completedAt: null,
      createdAt: "2026-09-24T00:00:00.000Z",
      updatedAt: "2026-09-24T00:00:00.000Z",
    };

    const repository: StudyTaskRepository = {
      create: vi.fn().mockResolvedValue(created),
      listUpcoming: vi.fn(),
      getById: vi.fn(),
    };

    const service = new StudyTaskService(repository);
    const result = await service.create({
      ownerId: "user-1",
      title: " Revisar capítulo 2 ",
    });

    expect(result).toEqual(created);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: "user-1",
        title: "Revisar capítulo 2",
        status: "pending",
        dueAt: null,
        completedAt: null,
      }),
    );
  });
});
