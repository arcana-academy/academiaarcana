import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StudyItineraryPlanner } from "./StudyItineraryPlanner";

const pages = Array.from({ length: 6 }, (_, index) => ({
  id: `page${index}`,
  title: `Tema ${index}`,
  practiceCount: index === 0 ? 0 : 1,
  workspaceHref: `/workspace?page=page${index}`,
  practiceHref: `/pratica?pagina=page${index}`,
}));

describe("StudyItineraryPlanner", () => {
  it("starts empty and builds an accessible, unsaved itinerary with correct links", () => {
    render(<StudyItineraryPlanner pages={pages} />);
    expect(screen.getByText("Selecione uma página acima para começar.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /Tema 0/ }));
    expect(screen.getByRole("status")).toHaveTextContent("1 de 5");
    expect(screen.getByRole("link", { name: /Abrir página/ })).toHaveAttribute("href", "/workspace?page=page0");
    expect(screen.getByRole("link", { name: /Criar atividade na Prática/ })).toHaveAttribute("href", "/pratica?pagina=page0");
    expect(screen.getByRole("link", { name: /Abrir página/ })).toHaveAttribute("target", "_blank");
    expect(screen.getByText(/não cria tarefas, tentativas, notas, XP ou progresso/)).toBeInTheDocument();
  });

  it("limits to five, supports reorder and removal, and resets without saving", () => {
    render(<StudyItineraryPlanner pages={pages} />);
    for (let i = 0; i < 5; i += 1) fireEvent.click(screen.getByRole("checkbox", { name: new RegExp(`Tema ${i}`) }));
    expect(screen.getByRole("checkbox", { name: /Tema 5/ })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("5 de 5");
    fireEvent.click(screen.getByRole("button", { name: "Mover Tema 1 para cima" }));
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings[0]).toHaveTextContent("Tema 1");
    expect(headings[1]).toHaveTextContent("Tema 0");
    fireEvent.click(screen.getByRole("button", { name: "Remover Tema 0 do roteiro" }));
    expect(screen.getByRole("status")).toHaveTextContent("4 de 5");
    expect(screen.getByRole("checkbox", { name: /Tema 5/ })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Limpar roteiro sem salvar" }));
    expect(screen.getByRole("status")).toHaveTextContent("0 de 5");
    expect(screen.getByText("Selecione uma página acima para começar.")).toBeInTheDocument();
  });

  it("does not render a fabricated selection when no saved pages exist", () => {
    render(<StudyItineraryPlanner pages={[]} />);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.getByRole("status")).toHaveTextContent("0 de 5");
  });
});
