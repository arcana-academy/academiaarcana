import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TeacherLessonsDemo } from "./TeacherLessonsDemo";

describe("Professor Turma A — Aulas demonstrativas", () => {
  it("shows three clearly fictitious lessons with individual statuses", () => {
    render(<TeacherLessonsDemo />);
    expect(screen.getByText("3 aula(s) demonstrativa(s) encontrada(s)")).toBeInTheDocument();
    expect(screen.getByText("Aula 01 — Introdução à Academia")).toBeInTheDocument();
    expect(screen.getByText("Aula 02 — Grimórios e Conhecimento")).toBeInTheDocument();
    expect(screen.getByText("Aula 03 — Práticas Arcanas")).toBeInTheDocument();
    expect(screen.getByText(/Criar, editar, reorganizar, publicar aulas/)).toBeInTheDocument();
  });

  it("filters lessons by state and by subject, without network or student data", () => {
    render(<TeacherLessonsDemo />);
    fireEvent.change(screen.getByRole("combobox", { name: "Situação da aula" }), {
      target: { value: "Concluída" },
    });
    expect(screen.getByText("1 aula(s) demonstrativa(s) encontrada(s)")).toBeInTheDocument();
    expect(screen.queryByText("Aula 03 — Práticas Arcanas")).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar aula demonstrativa" }), {
      target: { value: "nada corresponde" },
    });
    expect(screen.getByText("Nenhuma aula demonstrativa corresponde aos filtros.")).toBeInTheDocument();
  });

  it("has expandable read-only lesson detail, including an unavailable-material state", () => {
    render(<TeacherLessonsDemo />);
    const lesson = screen.getByText("Aula 03 — Práticas Arcanas").closest("li");
    expect(lesson).not.toBeNull();
    if (!lesson) return;
    const detail = within(lesson).getByText("Detalhes e materiais demonstrativos");
    expect(detail.tagName.toLowerCase()).toBe("summary");
    expect(within(lesson).getByText("Materiais ainda não disponíveis nesta demonstração.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /publicar|editar|salvar|excluir|criar/i })).not.toBeInTheDocument();
  });
});
