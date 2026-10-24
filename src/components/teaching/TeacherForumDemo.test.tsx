import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FORUM_CATEGORIES, FORUM_STATES, TeacherForumDemo } from "./TeacherForumDemo";

describe("Professor → Turma A → Fórum (prévia)", () => {
  it("shows four fictional topics without messages, authors or write links", () => {
    const { container } = render(<TeacherForumDemo />);
    expect(FORUM_CATEGORIES).toHaveLength(4);
    expect(FORUM_STATES).toHaveLength(4);
    expect(screen.getByText("4 tópico(s) demonstrativo(s) encontrado(s)")).toBeInTheDocument();
    expect(screen.getByText("Como organizar um grimório? (fictício)")).toBeInTheDocument();
    expect(screen.getByText("Roteiro coletivo de revisão (fictício)")).toBeInTheDocument();
    expect(screen.getByText("Referências para a Aula 01 (fictício)")).toBeInTheDocument();
    expect(screen.getByText("Pergunta em revisão (fictícia)")).toBeInTheDocument();
    expect(container.querySelectorAll("a[href]")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: /responder|publicar|denunciar|moderar|excluir|arquivar|criar/i })).not.toBeInTheDocument();
  });

  it("combines category and status filters, including an accessible empty state", () => {
    render(<TeacherForumDemo />);
    fireEvent.change(screen.getByRole("combobox", { name: "Categoria do fórum" }), {
      target: { value: "Dúvidas" },
    });
    expect(screen.getByText("2 tópico(s) demonstrativo(s) encontrado(s)")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Situação do tópico" }), {
      target: { value: "Arquivado" },
    });
    expect(screen.getByText("0 tópico(s) demonstrativo(s) encontrado(s)")).toBeInTheDocument();
    expect(screen.getByText("Nenhum tópico demonstrativo corresponde aos filtros.")).toBeInTheDocument();
  });

  it("filters text and offers explanatory disclosure without real content", () => {
    render(<TeacherForumDemo />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar tópico demonstrativo" }), {
      target: { value: "revisão" },
    });
    expect(screen.getByText("2 tópico(s) demonstrativo(s) encontrado(s)")).toBeInTheDocument();
    const card = screen.getByText("Pergunta em revisão (fictícia)").closest("li");
    expect(card).not.toBeNull();
    if (!card) return;
    expect(within(card).getByText("Ver orientação demonstrativa").tagName).toBe("SUMMARY");
    expect(within(card).getByText(/Respostas e histórico: indisponíveis/)).toBeInTheDocument();
    expect(screen.getByText("Moderação e privacidade — proposta visual")).toBeInTheDocument();
  });
});
