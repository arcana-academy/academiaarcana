// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { StudyTask } from "@/domains/planning";
import { StudyTaskBoard } from "./StudyTaskBoard";

const task: StudyTask = {
  id: "task-a11y",
  ownerId: "user-1",
  title: "Revisar acessibilidade",
  dueAt: "2026-10-08T14:00:00.000Z",
  status: "pending",
  completedAt: null,
  createdAt: "2026-10-07T10:00:00.000Z",
  updatedAt: "2026-10-07T10:00:00.000Z",
};

describe("StudyTaskBoard accessibility contract", () => {
  it("keeps labelled regions, associated fields and non-colour-only controls inside the pilot scope", () => {
    render(
      <StudyTaskBoard
        tasks={[task]}
        onCreate={vi.fn().mockResolvedValue(task)}
        onComplete={vi.fn().mockResolvedValue(task)}
      />,
    );

    const main = screen.getByRole("main", { name: "Cronograma" });
    expect(main).toHaveClass("aa-study-task-board");
    expect(screen.getByLabelText("Tarefa")).toHaveAttribute("id", "study-task-title");
    expect(screen.getByLabelText("Prazo")).toHaveAttribute("id", "study-task-due");
    expect(screen.getByRole("form", { name: "Adicionar tarefa de estudo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Concluir" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar ao Todoist" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar ao Asana" })).toBeInTheDocument();
  });

  it("announces creation failures with an alert", async () => {
    render(
      <StudyTaskBoard
        tasks={[]}
        onCreate={vi.fn().mockRejectedValue(new Error("expected"))}
        onComplete={vi.fn().mockResolvedValue(task)}
      />,
    );

    fireEvent.change(screen.getByLabelText("Tarefa"), { target: { value: "Nova tarefa" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar tarefa" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível criar a tarefa."),
    );
  });
});
