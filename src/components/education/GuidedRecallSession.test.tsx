import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GuidedRecallSession, type GuidedRecallItem } from "./GuidedRecallSession";

const items: GuidedRecallItem[] = [
  { id: "item-1", pageTitle: "Biologia", prompt: "Descreva a célula.", practiceHref: "/pratica?pagina=page1&item=item-1" },
  { id: "item-2", pageTitle: "Química", prompt: "O que é ligação química?", practiceHref: "/pratica?pagina=page2&item=item-2" },
];

describe("GuidedRecallSession", () => {
  it("makes the learner recall first and discloses no reference or persisted credit", () => {
    render(<GuidedRecallSession items={items} />);
    expect(screen.getByRole("heading", { name: "Descreva a célula." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Próxima pergunta" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Abrir Prática para registrar tentativa" })).toHaveAttribute(
      "href",
      "/pratica?pagina=page1&item=item-1",
    );
    expect(screen.queryByText(/resposta de referência/i)).not.toBeInTheDocument();
    expect(screen.getByText(/não registra tentativas, notas, XP, missões ou tarefas/i)).toBeInTheDocument();
  });

  it("keeps ratings ephemeral and supports going back, finishing and restarting", () => {
    render(<GuidedRecallSession items={items} />);
    fireEvent.click(screen.getByLabelText("Preciso revisar e tentar novamente"));
    expect(screen.getByText(/não foi registrada no histórico/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Próxima pergunta" }));
    expect(screen.getByRole("heading", { name: "O que é ligação química?" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Próxima pergunta" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    expect(screen.getByLabelText("Preciso revisar e tentar novamente")).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Próxima pergunta" }));
    fireEvent.click(screen.getByLabelText("Consegui recordar os pontos principais"));
    expect(screen.getByRole("heading", { name: "Sessão de reflexão concluída" })).toBeInTheDocument();
    expect(screen.getByText(/1 lembrança\(s\) satisfatória\(s\) e 1 item\(ns\) para revisar/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Recomeçar sem salvar" }));
    expect(screen.getByRole("heading", { name: "Descreva a célula." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Próxima pergunta" })).toBeDisabled();
    expect(screen.queryByRole("heading", { name: "Sessão de reflexão concluída" })).not.toBeInTheDocument();
  });

  it("offers a focused round only for items marked to review, without persisting ratings", () => {
    render(<GuidedRecallSession items={items} />);

    fireEvent.click(screen.getByLabelText("Preciso revisar e tentar novamente"));
    fireEvent.click(screen.getByRole("button", { name: "Próxima pergunta" }));
    fireEvent.click(screen.getByLabelText("Consegui recordar os pontos principais"));

    const retry = screen.getByRole("button", { name: "Refazer somente itens para revisar" });
    fireEvent.click(retry);

    expect(screen.getByText(/Rodada de reforço · Atividade 1 de 1/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Descreva a célula." })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "O que é ligação química?" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Preciso revisar e tentar novamente")).not.toBeChecked();
    expect(screen.queryByRole("button", { name: "Refazer somente itens para revisar" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Consegui recordar os pontos principais"));
    expect(screen.getByText(/1 lembrança\(s\) satisfatória\(s\) e 0 item\(ns\) para revisar/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refazer somente itens para revisar" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Recomeçar sem salvar" }));
    expect(screen.getByText(/Rodada completa · Atividade 1 de 2/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Próxima pergunta" })).toBeDisabled();
  });

  it("does not offer selective retry when every item was recalled", () => {
    render(<GuidedRecallSession items={items} />);
    fireEvent.click(screen.getByLabelText("Consegui recordar os pontos principais"));
    fireEvent.click(screen.getByRole("button", { name: "Próxima pergunta" }));
    fireEvent.click(screen.getByLabelText("Consegui recordar os pontos principais"));

    expect(screen.getByRole("heading", { name: "Sessão de reflexão concluída" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refazer somente itens para revisar" })).not.toBeInTheDocument();
  });

  it("can repeat focused recall without reintroducing already remembered items", () => {
    render(<GuidedRecallSession items={items} />);
    fireEvent.click(screen.getByLabelText("Preciso revisar e tentar novamente"));
    fireEvent.click(screen.getByRole("button", { name: "Próxima pergunta" }));
    fireEvent.click(screen.getByLabelText("Consegui recordar os pontos principais"));
    fireEvent.click(screen.getByRole("button", { name: "Refazer somente itens para revisar" }));
    fireEvent.click(screen.getByLabelText("Preciso revisar e tentar novamente"));
    fireEvent.click(screen.getByRole("button", { name: "Refazer somente itens para revisar" }));

    expect(screen.getByText(/Rodada de reforço · Atividade 1 de 1/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "O que é ligação química?" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Preciso revisar e tentar novamente")).not.toBeChecked();
  });

  it("handles an empty list without inventing prompts", () => {
    render(<GuidedRecallSession items={[]} />);
    expect(screen.getByText("Nenhuma atividade disponível para esta sessão.")).toBeInTheDocument();
  });
});
