import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TeacherClassTabsDemo, TEACHER_CLASS_TAB_LABELS } from "./TeacherClassTabsDemo";

describe("Professor Turma A tabs prototype", () => {
  it("has nine unique accessible tabs and a panel without real student information", () => {
    render(<TeacherClassTabsDemo />);
    expect(screen.getAllByRole("tab")).toHaveLength(9);
    expect(new Set(TEACHER_CLASS_TAB_LABELS).size).toBe(9);
    expect(screen.getByRole("tab", { name: "Visão Geral" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Sem indicadores acadêmicos reais");
    expect(screen.queryByRole("button", { name: /criar aula|editar|exportar|excluir/i })).not.toBeInTheDocument();
  });

  it("selects Aulas and Alunos without loading sensitive data", () => {
    render(<TeacherClassTabsDemo />);
    fireEvent.click(screen.getByRole("tab", { name: "Aulas" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Aulas da Turma");
    fireEvent.click(screen.getByRole("tab", { name: "Alunos" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Nenhum dado pessoal de estudantes");
  });

  it("supports Arrow, Home and End keyboard tab navigation", () => {
    render(<TeacherClassTabsDemo />);
    const first = screen.getByRole("tab", { name: "Visão Geral" });
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowRight" });
    const second = screen.getByRole("tab", { name: "Aulas" });
    expect(second).toHaveFocus();
    expect(second).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(second, { key: "End" });
    const last = screen.getByRole("tab", { name: "Configurações" });
    expect(last).toHaveFocus();
    fireEvent.keyDown(last, { key: "Home" });
    expect(first).toHaveAttribute("aria-selected", "true");
    expect(first).toHaveFocus();
  });
});
