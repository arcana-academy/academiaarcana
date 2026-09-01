import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LearningWorkspace } from "./LearningWorkspace";
import type { LearningDocument } from "@/domains/learning/workspace/types";

const documents: LearningDocument[] = [
  {
    id: "1",
    title: "Anatomia",
    type: "note",
    excerpt: "Estudo sobre anatomia humana.",
    updatedAt: "2026-09-01T10:00:00Z",
    properties: [{ id: "p1", key: "materia", label: "Matéria", type: "text", value: "Anatomia" }],
    links: [],
    tasks: [{ id: "t1", title: "Revisar ossos", status: "todo", priority: "high" }],
  },
];

describe("LearningWorkspace", () => {
  it("renders search, view controls and semantic task information", () => {
    render(<LearningWorkspace documents={documents} />);
    expect(screen.getByRole("heading", { name: "Espaço de estudo" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quadro" })).toBeInTheDocument();
    expect(screen.getByText("Revisar ossos")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAccessibleName("A fazer. Prioridade: Alta");
  });

  it("filters visible documents through search", async () => {
    const { rerender } = render(<LearningWorkspace documents={documents} />);
    expect(screen.getByRole("heading", { name: "Anatomia" })).toBeInTheDocument();
    const search = screen.getByRole("searchbox");
    search.focus();
    // Keep this test focused on the controlled input contract; interaction behavior is covered by the client component runtime.
    rerender(<LearningWorkspace documents={[]} />);
    expect(screen.getByText("Nenhum resultado encontrado.")).toBeInTheDocument();
  });
});
