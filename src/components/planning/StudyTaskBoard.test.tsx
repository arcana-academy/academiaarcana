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
  it("creates a task and adds it to the visible schedule through the labeled form", async () => {
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
    expect(screen.getByRole("button", { name: "Criar tarefa" })).toHaveAttribute("type", "submit");
    fireEvent.submit(screen.getByRole("form", { name: "Adicionar tarefa de estudo" }));

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith({
        title: "Nova revisão",
        dueAt: null,
      }),
    );
    expect(await screen.findByText("Nova revisão")).toBeInTheDocument();
    expect(document.querySelector('img[src="/assets/icons/aa-cronograma.svg"]')).toBeInTheDocument();
  });

  it("offers a direct route to the task form when the schedule is empty", () => {
    render(
      <StudyTaskBoard
        tasks={[]}
        onCreate={vi.fn()}
        onComplete={vi.fn().mockResolvedValue(task)}
      />,
    );

    expect(screen.getByText("Nenhuma tarefa futura cadastrada.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Criar primeira tarefa" })).toHaveAttribute(
      "href",
      "#study-task-title",
    );
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
  it("shows Outlook scheduling for tasks with a due time and calls the server action", async () => {
    const onScheduleInOutlook = vi.fn().mockResolvedValue({
      webLink: null,
    });

    render(
      <StudyTaskBoard
        tasks={[task]}
        outlookConnected
        onScheduleInOutlook={onScheduleInOutlook}
        onCreate={vi.fn()}
        onComplete={vi.fn().mockResolvedValue(task)}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Agendar no Outlook" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Agendar no Outlook" }),
    );

    await waitFor(() =>
      expect(onScheduleInOutlook).toHaveBeenCalledWith("task-1"),
    );
  });

  it("sends a study task to Asana without mutating the native task state", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ task: { id: "asana-task-1", name: task.title } }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <StudyTaskBoard
        tasks={[task]}
        onCreate={vi.fn()}
        onComplete={vi.fn().mockResolvedValue(task)}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Enviar ao Asana" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/integrations/asana/tasks",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: task.title,
          notes: "Enviada a partir do Cronograma da Academia Arcana.",
          dueOn: "2026-09-25",
        }),
      }),
    ));
    expect(screen.getByRole("button", { name: "Enviado ao Asana" })).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
