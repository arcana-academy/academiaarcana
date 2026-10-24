import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ACTIVITY_STATES, ACTIVITY_TYPES, TeacherActivitiesDemo } from "./TeacherActivitiesDemo";

describe("Professor → Turma A → Atividades (prévia)", () => {
  it("shows four fictional records, with distinct states, and no data or write links", () => {
    const { container } = render(<TeacherActivitiesDemo />);
    expect(ACTIVITY_TYPES).toHaveLength(4);
    expect(ACTIVITY_STATES).toHaveLength(5);
    expect(screen.getByText("4 atividade(s) demonstrativa(s) encontrada(s)")).toBeInTheDocument();
    expect(screen.getByText("Explorando conceitos mágicos (fictícia)")).toBeInTheDocument();
    expect(screen.getByText("Revisão dos Grimórios (fictícia)")).toBeInTheDocument();
    expect(screen.getByText("Missão de Práticas Arcanas (fictícia)")).toBeInTheDocument();
    expect(screen.getByText("Retomada dos Fundamentos (fictícia)")).toBeInTheDocument();
    expect(container.querySelectorAll("a[href]")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: /publicar|corrigir|editar|criar|excluir|atribuir/i })).not.toBeInTheDocument();
  });

  it("combines type, state and keyword filters, then shows empty state", () => {
    render(<TeacherActivitiesDemo />);
    fireEvent.change(screen.getByRole("combobox", { name: "Tipo de atividade" }), { target: { value: "Exercício" } });
    expect(screen.getByText("2 atividade(s) demonstrativa(s) encontrada(s)")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Situação da atividade" }), { target: { value: "Encerrada" } });
    expect(screen.getByText("1 atividade(s) demonstrativa(s) encontrada(s)")).toBeInTheDocument();
    expect(screen.getByText("Retomada dos Fundamentos (fictícia)")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar atividade demonstrativa" }), { target: { value: "sem correspondência" } });
    expect(screen.getByText("0 atividade(s) demonstrativa(s) encontrada(s)")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma atividade demonstrativa corresponde aos filtros.")).toBeInTheDocument();
  });

  it("provides native expandable instructions with no real participation data", () => {
    render(<TeacherActivitiesDemo />);
    const card = screen.getByText("Revisão dos Grimórios (fictícia)").closest("li");
    expect(card).not.toBeNull();
    if (!card) return;
    expect(within(card).getByText("Ver orientações e critérios demonstrativos").tagName).toBe("SUMMARY");
    expect(within(card).getByText("Organização")).toBeInTheDocument();
    expect(within(card).getByText(/Entregas e participação: informações indisponíveis/)).toBeInTheDocument();
  });
});
