import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { REPORT_CATEGORIES, REPORT_PERIODS, TeacherReportsDemo } from "./TeacherReportsDemo";

describe("Professor → Turma A → Relatórios (prévia)", () => {
  it("shows four placeholder report areas with no fake statistics or external links", () => {
    const { container } = render(<TeacherReportsDemo />);
    expect(REPORT_CATEGORIES).toHaveLength(5);
    expect(REPORT_PERIODS).toHaveLength(3);
    expect(screen.getByText(/4 área\(s\) de relatório demonstrativa\(s\) encontrada\(s\)/)).toBeInTheDocument();
    expect(screen.getByText("Participação da turma")).toBeInTheDocument();
    expect(screen.getByText("Evolução da aprendizagem")).toBeInTheDocument();
    expect(screen.getByText("Acompanhamento de atividades")).toBeInTheDocument();
    expect(screen.getByText("Visão pedagógica de avaliações")).toBeInTheDocument();
    expect(screen.getAllByText("Dados indisponíveis")).toHaveLength(4);
    expect(container.querySelectorAll("a[href]")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: /exportar|baixar|salvar|criar|compartilhar/i })).not.toBeInTheDocument();
  });

  it("combines category and keyword filters and provides an empty state", () => {
    render(<TeacherReportsDemo />);
    fireEvent.change(screen.getByRole("combobox", { name: "Área do relatório" }), {
      target: { value: "Atividades" },
    });
    expect(screen.getByText(/1 área\(s\) de relatório demonstrativa\(s\) encontrada\(s\)/)).toBeInTheDocument();
    expect(screen.queryByText("Evolução da aprendizagem")).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar área de relatório" }), {
      target: { value: "assunto inexistente" },
    });
    expect(screen.getByText("Nenhuma área de relatório corresponde aos filtros.")).toBeInTheDocument();
  });

  it("changes only the illustrative period and discloses security requirements", () => {
    render(<TeacherReportsDemo />);
    fireEvent.change(screen.getByRole("combobox", { name: "Período de referência (demonstrativo)" }), {
      target: { value: "Últimos 90 dias" },
    });
    expect(screen.getByText(/Período ilustrativo selecionado: Últimos 90 dias/)).toBeInTheDocument();
    const item = screen.getByText("Participação da turma").closest("li");
    expect(item).not.toBeNull();
    if (!item) return;
    expect(within(item).getByText("Ver requisitos antes da integração").tagName).toBe("SUMMARY");
    expect(within(item).getByText(/Vínculo professor–turma/)).toBeInTheDocument();
  });
});
