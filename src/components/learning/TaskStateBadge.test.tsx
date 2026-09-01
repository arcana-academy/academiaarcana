import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TaskStateBadge } from "./TaskStateBadge";

const expectedLabels = {
  todo: "A fazer",
  in_progress: "Em andamento",
  done: "Concluída",
  cancelled: "Cancelada",
  scheduled: "Agendada",
  blocked: "Bloqueada",
  question: "Pergunta",
  idea: "Ideia",
} as const;

describe("TaskStateBadge", () => {
  it.each(Object.entries(expectedLabels))(
    "renders an accessible status label for %s",
    (status, label) => {
      render(<TaskStateBadge status={status as keyof typeof expectedLabels} />);
      expect(screen.getByRole("status")).toHaveAccessibleName(label);
    },
  );

  it("renders priority without changing the status meaning", () => {
    render(<TaskStateBadge status="todo" priority="urgent" />);
    expect(screen.getByRole("status")).toHaveAccessibleName("A fazer. Prioridade: Urgente");
    expect(screen.getByText("Urgente")).toBeInTheDocument();
  });

  it("does not require color to communicate state", () => {
    render(<TaskStateBadge status="done" />);
    const badge = screen.getByRole("status");
    expect(badge).toHaveTextContent("✓");
    expect(badge).toHaveTextContent("Concluída");
  });
});
