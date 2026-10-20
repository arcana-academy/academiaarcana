// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { StudyTask } from "@/domains/planning";
import { StudyTaskBoard } from "./StudyTaskBoard";

const task: StudyTask = {
  id: "task-reopen-1",
  ownerId: "owner-synthetic",
  title: "Revisar runas",
  dueAt: "2026-10-18T14:00:00.000Z",
  status: "pending",
  completedAt: null,
  createdAt: "2026-10-17T12:00:00.000Z",
  updatedAt: "2026-10-17T12:00:00.000Z",
};

describe("Cronograma server snapshot acknowledgment and reopening", () => {
  it("retains an unacknowledged creation, then honors server edits and removal after acknowledgment", async () => {
    const create = vi.fn().mockResolvedValue(task);
    const complete = vi.fn();
    const { rerender } = render(<StudyTaskBoard tasks={[]} onCreate={create} onComplete={complete} />);
    fireEvent.change(screen.getByLabelText("Tarefa"), { target: { value: task.title } });
    fireEvent.submit(screen.getByRole("form", { name: "Adicionar tarefa de estudo" }));
    expect(await screen.findByText(task.title)).toBeInTheDocument();
    // An empty snapshot received before creation acknowledgment is stale.
    rerender(<StudyTaskBoard tasks={[]} onCreate={create} onComplete={complete} />);
    expect(screen.getAllByText(task.title)).toHaveLength(1);
    const edited = { ...task, title: "Título confirmado pelo servidor" };
    rerender(<StudyTaskBoard tasks={[edited]} onCreate={create} onComplete={complete} />);
    expect(screen.getByText(edited.title)).toBeInTheDocument();
    expect(screen.queryByText(task.title)).not.toBeInTheDocument();
    rerender(<StudyTaskBoard tasks={[]} onCreate={create} onComplete={complete} />);
    expect(screen.queryByText(edited.title)).not.toBeInTheDocument();
    expect(screen.queryByText(task.title)).not.toBeInTheDocument();
  });

  it("shows a newly received server task without remounting the board", () => {
    const newTask = { ...task, id: "new-server-task", title: "Preparar poções" };
    const create = vi.fn();
    const complete = vi.fn();
    const { rerender } = render(
      <StudyTaskBoard tasks={[task]} onCreate={create} onComplete={complete} />,
    );

    expect(screen.queryByText("Preparar poções")).not.toBeInTheDocument();
    rerender(
      <StudyTaskBoard tasks={[task, newTask]} onCreate={create} onComplete={complete} />,
    );
    expect(screen.getByText("Preparar poções")).toBeInTheDocument();
  });

  it("keeps a completed task hidden through a stale server snapshot, then restores a reopened task", async () => {
    const complete = vi.fn().mockResolvedValue({ ...task, status: "completed" });
    const create = vi.fn();
    const { rerender } = render(
      <StudyTaskBoard tasks={[task]} onCreate={create} onComplete={complete} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Concluir" }));
    await waitFor(() => expect(screen.queryByText(task.title)).not.toBeInTheDocument());
    rerender(<StudyTaskBoard tasks={[{ ...task }]} onCreate={create} onComplete={complete} />);
    expect(screen.queryByText(task.title)).not.toBeInTheDocument();

    // A new server snapshot without this ID acknowledges completion.
    rerender(<StudyTaskBoard tasks={[]} onCreate={create} onComplete={complete} />);
    expect(screen.queryByText(task.title)).not.toBeInTheDocument();

    // A later server snapshot may contain the same ID, legitimately reopened.
    rerender(
      <StudyTaskBoard
        tasks={[{ ...task, updatedAt: "2026-10-18T18:00:00.000Z" }]}
        onCreate={create}
        onComplete={complete}
      />,
    );
    expect(screen.getByText(task.title)).toBeInTheDocument();
  });

  it("can complete the same ID again after the server confirms a reopen", async () => {
    const complete = vi.fn().mockResolvedValue({ ...task, status: "completed" });
    const create = vi.fn();
    const { rerender } = render(
      <StudyTaskBoard tasks={[task]} onCreate={create} onComplete={complete} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Concluir" }));
    await waitFor(() => expect(screen.queryByText(task.title)).not.toBeInTheDocument());
    rerender(<StudyTaskBoard tasks={[]} onCreate={create} onComplete={complete} />);
    rerender(<StudyTaskBoard tasks={[{ ...task }]} onCreate={create} onComplete={complete} />);
    fireEvent.click(screen.getByRole("button", { name: "Concluir" }));
    await waitFor(() => expect(complete).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(task.title)).not.toBeInTheDocument();
  });

  it("does not resurrect a completed optimistic task after the server omits it", async () => {
    const created = { ...task, id: "optimistic-completed", title: "Estudar alquimia" };
    const create = vi.fn().mockResolvedValue(created);
    const complete = vi.fn().mockResolvedValue({ ...created, status: "completed" });
    const { rerender } = render(
      <StudyTaskBoard tasks={[]} onCreate={create} onComplete={complete} />,
    );
    fireEvent.change(screen.getByLabelText("Tarefa"), { target: { value: created.title } });
    fireEvent.submit(screen.getByRole("form", { name: "Adicionar tarefa de estudo" }));
    expect(await screen.findByText(created.title)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Concluir" }));
    await waitFor(() => expect(screen.queryByText(created.title)).not.toBeInTheDocument());
    rerender(<StudyTaskBoard tasks={[]} onCreate={create} onComplete={complete} />);
    expect(screen.queryByText(created.title)).not.toBeInTheDocument();
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("does not duplicate an optimistic task once the server acknowledges creation", async () => {
    const created = { ...task, id: "created-id", title: "Criar grimório" };
    const create = vi.fn().mockResolvedValue(created);
    const complete = vi.fn();
    const { rerender } = render(
      <StudyTaskBoard tasks={[]} onCreate={create} onComplete={complete} />,
    );
    fireEvent.change(screen.getByLabelText("Tarefa"), { target: { value: created.title } });
    fireEvent.submit(screen.getByRole("form", { name: "Adicionar tarefa de estudo" }));
    expect(await screen.findByText(created.title)).toBeInTheDocument();
    rerender(<StudyTaskBoard tasks={[created]} onCreate={create} onComplete={complete} />);
    expect(screen.getAllByText(created.title)).toHaveLength(1);
  });
});
