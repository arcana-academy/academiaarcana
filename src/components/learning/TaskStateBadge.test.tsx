import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TaskStateBadge } from "./TaskStateBadge";

const statuses = [
  "todo",
  "in_progress",
  "done",
  "cancelled",
  "scheduled",
  "blocked",
  "question",
  "idea",
] as const;

describe("TaskStateBadge", () => {
  it("renders an accessible status label and symbol for every task state", () => {
    for (const status of statuses) {
      const { unmount } = render(<TaskStateBadge status={status} />);
      expect(screen.getByText(status === "in_progress" ? "Em andamento" : expect.any(String))).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveAccessibleName();
      unmount();
    }
  });

  it("renders priority without changing the status meaning", () => {
    render(<TaskStateBadge status="todo" priority="urgent" />);
    expect(screen.getByRole("status")).toHaveTextContent("A fazer");
    expect(screen.getByText("Urgente")).toBeInTheDocument();
  });

  it("does not require color to communicate state", () => {
    render(<TaskStateBadge status="done" />);
    const badge = screen.getByRole("status");
    expect(badge).toHaveTextContent("✓");
    expect(badge).toHaveTextContent("Concluída");
  });
});
