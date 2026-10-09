import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ASSESSMENT_KINDS, ASSESSMENT_STATUSES, TeacherAssessmentsDemo } from "./TeacherAssessmentsDemo";

describe("Professor → Turma A → Avaliações (prévia)", () => {
  it("renders three explicitly fictitious assessments without scores, student data or write controls", () => {
    const { container } = render(<TeacherAssessmentsDemo />);
    expect(ASSESSMENT_KINDS).toHaveLength(4);
    expect(ASSESSMENT_STATUSES).toHaveLength(4);
    expect(screen.getByText("3 avaliação(ões) demonstrativa(s) encontrada(s)")).toBeInTheDocument();
    expect(screen.getByText("Sondagem dos Fundamentos (fictícia)")).toBeInTheDocument();
    expect(screen.getByText("Reflexões sobre Grimórios (fictícia)")).toBeInTheDocument();
    expect(screen.getByText("Síntese de Práticas Arcanas (fictícia)")).toBeInTheDocument();
    expect(container.querySelectorAll("a[href]")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: /salvar|corrigir|editar|criar|publicar|excluir|exportar/i })).not.toBeInTheDocument();
  });

  it("combines kind, state and query, returning an accessible empty result", () => {
    render(<TeacherAssessmentsDemo />);
    fireEvent.change(screen.getByRole("combobox", { name: "Tipo de avaliação" }), { target: { value: "Formativa" } });
    expect(screen.getByText("1 avaliação(ões) demonstrativa(s) encontrada(s)")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Situação da avaliação" }), { target: { value: "Encerrada" } });
    expect(screen.getByText("0 avaliação(ões) demonstrativa(s) encontrada(s)")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma avaliação demonstrativa corresponde aos filtros.")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Situação da avaliação" }), { target: { value: "Programada" } });
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar avaliação demonstrativa" }), { target: { value: "grimórios" } });
    expect(screen.getByText("Reflexões sobre Grimórios (fictícia)")).toBeInTheDocument();
  });

  it("exposes rubrics and progress levels as illustrative descriptions, not grades", () => {
    render(<TeacherAssessmentsDemo />);
    const record = screen.getByText("Sondagem dos Fundamentos (fictícia)").closest("li");
    expect(record).not.toBeNull();
    if (!record) return;
    expect(within(record).getByText("Ver rubrica e critérios demonstrativos").tagName).toBe("SUMMARY");
    expect(within(record).getByText("Identificação de conceitos")).toBeInTheDocument();
    expect(within(record).getAllByText(/Em desenvolvimento · Em progresso · Consolidado/)).toHaveLength(2);
    expect(within(record).getByText(/Entregas e resultados: indisponíveis/)).toBeInTheDocument();
  });
});
