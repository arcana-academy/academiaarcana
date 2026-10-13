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

  it.each([
    "not-a-date",
    "2026-99-99T99:99:99.000Z",
    "   ",
  ])("rejects malformed dueAt %j before touching persistence", async (dueAt) => {
    const repository: StudyTaskRepository = {
      create: vi.fn(),
      listUpcoming: vi.fn(),
      getById: vi.fn(),
    };
    const service = new StudyTaskService(repository);

    await expect(
      service.create({
        ownerId: "synthetic-user",
        title: "Revisar conteúdo",
        dueAt,
      }),
    ).rejects.toThrow("Prazo da tarefa inválido.");
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("preserves a valid explicit ISO dueAt in the persisted task", async () => {
    const dueAt = "2026-10-14T15:30:00.000Z";
    const repository: StudyTaskRepository = {
      create: vi.fn(async (task) => task),
      listUpcoming: vi.fn(),
      getById: vi.fn(),
    };
    const service = new StudyTaskService(repository);

    const result = await service.create({
      ownerId: "synthetic-user",
      title: "Estudar",
      dueAt,
    });

    expect(result.dueAt).toBe(dueAt);
    expect(repository.create).toHaveBeenCalledOnce();
  });
});
