// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { StudyTask } from "@/domains/planning";
import { StudyTaskBoard } from "./StudyTaskBoard";

const created: StudyTask = {
  id: "locally-created-and-completed",
  ownerId: "synthetic-owner",
  title: "Preparar atividade sintética",
  dueAt: null,
  status: "pending",
  completedAt: null,
  createdAt: "2026-10-19T10:00:00.000Z",
  updatedAt: "2026-10-19T10:00:00.000Z",
};

describe("Cronograma optimistic completion acknowledgment", () => {
  it("does not resurrect a locally created and completed task when the server omits it", async () => {
    const onCreate = vi.fn().mockResolvedValue(created);
    const onComplete = vi.fn().mockResolvedValue({
      ...created,
      status: "completed",
      completedAt: "2026-10-19T10:01:00.000Z",
    });
    const { rerender } = render(
      <StudyTaskBoard tasks={[]} onCreate={onCreate} onComplete={onComplete} />,
    );

    fireEvent.change(screen.getByLabelText("Tarefa"), {
      target: { value: created.title },
    });
    fireEvent.submit(screen.getByRole("form", { name: "Adicionar tarefa de estudo" }));
    expect(await screen.findByText(created.title)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Concluir" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(created.id));
    await waitFor(() => expect(screen.queryByText(created.title)).not.toBeInTheDocument());

    // A new authoritative snapshot still excludes the completed task.
    // Absence is an acknowledgment of completion, never a reopen event.
    rerender(
      <StudyTaskBoard tasks={[]} onCreate={onCreate} onComplete={onComplete} />,
    );
    expect(screen.queryByText(created.title)).not.toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
