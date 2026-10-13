import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GuidedPageReading } from "./GuidedPageReading";

const blocks = [
  { type: "paragraph" as const, content: "  Primeiro ponto de estudo.  " },
  { type: "paragraph" as const, content: " \n " },
  { type: "paragraph" as const, content: "Segundo ponto de estudo.\nOutra linha." },
];

describe("GuidedPageReading", () => {
  it("shows only authored nonblank blocks, never generates evidence or credit", () => {
    render(<GuidedPageReading title="Biologia" blocks={blocks} onClose={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Modo de leitura guiada" })).toBeInTheDocument();
    expect(screen.getByText("Primeiro ponto de estudo.")).toBeInTheDocument();
    expect(screen.queryByText(/Segundo ponto de estudo/)).not.toBeInTheDocument();
    expect(screen.getByText("Trecho 1 de 2")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getByText(/não registra conclusão da página, tentativas, missões ou XP/)).toBeInTheDocument();
  });

  it("moves backward, reaches the end and restarts without saving", () => {
    render(<GuidedPageReading title="Biologia" blocks={blocks} onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Trecho anterior" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Próximo trecho" }));
    expect(screen.getByText(/Segundo ponto de estudo/)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    fireEvent.click(screen.getByRole("button", { name: "Trecho anterior" }));
    expect(screen.getByText("Primeiro ponto de estudo.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Próximo trecho" }));
    fireEvent.click(screen.getByRole("button", { name: "Encerrar leitura nesta tela" }));
    expect(screen.getByText(/Nada foi salvo no histórico de estudo/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Recomeçar leitura" }));
    expect(screen.getByText("Primeiro ponto de estudo.")).toBeInTheDocument();
    expect(screen.queryByText(/Nada foi salvo no histórico de estudo/)).not.toBeInTheDocument();
  });

  it("renders text as escaped content rather than executable HTML", () => {
    const { container } = render(
      <GuidedPageReading
        title="Página"
        blocks={[{ type: "paragraph", content: '<img src=x onerror="evil()">' }]}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('<img src=x onerror="evil()">')).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  it("handles blank documents and closes back to the editor", () => {
    const onClose = vi.fn();
    render(
      <GuidedPageReading
        title="Vazia"
        blocks={[{ type: "paragraph", content: "  " }]}
        onClose={onClose}
      />,
    );
    expect(screen.getByText("Esta página ainda não tem trechos de conteúdo para ler.")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao editor" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
