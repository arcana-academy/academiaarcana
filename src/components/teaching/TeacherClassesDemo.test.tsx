import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TeacherClassesDemo } from "./TeacherClassesDemo";

describe("Professor / Turmas prototype", () => {
  it("labels every result as demonstrative and never exposes write actions", () => {
    render(<TeacherClassesDemo />);
    expect(screen.getByText("3 turma(s) demonstrativa(s) encontrada(s)")).toBeInTheDocument();
    expect(screen.getByText("Fundamentos da Magia — Turma A")).toBeInTheDocument();
    expect(screen.getByText(/Acesso real bloqueado:/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /criar|editar|excluir/i })).not.toBeInTheDocument();
  });

  it("filters locally by search and stage, with an accessible empty state", () => {
    render(<TeacherClassesDemo />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar turma fictícia" }), {
      target: { value: "Grimórios" },
    });
    expect(screen.getByText("1 turma(s) demonstrativa(s) encontrada(s)")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Situação demonstrativa" }), {
      target: { value: "Concluída" },
    });
    expect(screen.getByText("0 turma(s) demonstrativa(s) encontrada(s)")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma turma demonstrativa corresponde aos filtros.")).toBeInTheDocument();
  });
});
