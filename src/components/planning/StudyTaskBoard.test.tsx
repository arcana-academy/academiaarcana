// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { StudyTask } from "@/domains/planning";

import { StudyTaskBoard } from "./StudyTaskBoard";

const task: StudyTask = {
  id: "task-1",
  ownerId: "user-1",
  title: "Revisar capítulo",
  dueAt: "2026-09-25T14:00:00.000Z",
  status: "pending",
  completedAt: null,
  createdAt: "2026-09-24T10:00:00.000Z",
  updatedAt: "2026-09-24T10:00:00.000Z",
};

describe("StudyTaskBoard", () => {
  it("creates a task and adds it to the visible schedule", async () => {
    const created = { ...task, id: "task-2", title: "Nova revisão" };
    const onCreate = vi.fn().mockResolvedValue(created);

    render(
      <StudyTaskBoard
        tasks={[task]}
        onCreate={onCreate}
        onComplete={vi.fn().mockResolvedValue(task)}
      />,
    );

    fireEvent.change(screen.getByLabelText("Tarefa"), {
      target: { value: "Nova revisão" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar tarefa" }));

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith({
        title: "Nova revisão",
        dueAt: null,
      }),
    );
    expect(await screen.findByText("Nova revisão")).toBeInTheDocument();
  });

  it("removes a completed task from the upcoming list", async () => {
    const onComplete = vi.fn().mockResolvedValue({
      ...task,
      status: "completed",
      completedAt: "2026-09-24T11:00:00.000Z",
    });

    render(
      <StudyTaskBoard
        tasks={[task]}
        onCreate={vi.fn()}
        onComplete={onComplete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Concluir" }));

    await waitFor(() => expect(onComplete).toHaveBeenCalledWith("task-1"));
    expect(screen.queryByText("Revisar capítulo")).not.toBeInTheDocument();
    expect(screen.getByText("Nenhuma tarefa futura cadastrada.")).toBeInTheDocument();
  });
});
