import { fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ConceptComparisonExcerpt } from "@/application/education/concept-comparison";
import { BlockSequencePractice } from "./BlockSequencePractice";

const page: ConceptComparisonExcerpt = {
  id: "user&own", title: "Ciclo da água",
  truncated: true,
  blocks: ["A água evapora e sobe para a atmosfera.", "O vapor resfria e forma nuvens.", "As gotas caem como chuva sobre a terra."],
};

describe("BlockSequencePractice", () => {
  it("reorders real saved passages and gives temporary nonpunitive feedback", () => {
    render(<BlockSequencePractice page={page} />);
    const list = screen.getByRole("list", { name: "Trechos para organizar" });
    expect(list.textContent).toContain(page.blocks[2]);
    expect(list.textContent?.indexOf(page.blocks[2])).toBeLessThan(list.textContent!.indexOf(page.blocks[0]));
    fireEvent.click(screen.getByRole("button", { name: "Conferir sequência" }));
    expect(screen.getByRole("status")).toHaveTextContent("1 de 3 trechos");
    fireEvent.click(screen.getByRole("button", { name: "Mover trecho da posição 3 para cima" }));
    fireEvent.click(screen.getByRole("button", { name: "Mover trecho da posição 2 para cima" }));
    fireEvent.click(screen.getByRole("button", { name: "Mover trecho da posição 3 para cima" }));
    fireEvent.click(screen.getByRole("button", { name: "Conferir sequência" }));
    expect(screen.getByRole("status")).toHaveTextContent("Sequência reconstruída corretamente");
    fireEvent.click(screen.getByRole("button", { name: "Recomeçar sem salvar" }));
    expect(screen.getByRole("status")).toHaveTextContent("Organize os trechos");
  });

  it("has disabled boundaries and keyboard-addressable labeled actions", () => {
    render(<BlockSequencePractice page={page} />);
    expect(screen.getByRole("button", { name: "Mover trecho da posição 1 para cima" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Mover trecho da posição 3 para baixo" })).toBeDisabled();
    expect(screen.getByRole("link", { name: /Abrir página inteira/ })).toHaveAttribute("href", "/workspace?page=user%26own");
    expect(screen.getByRole("link", { name: /Abrir página inteira/ })).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("escapes HTML-like saved text and never submits it", () => {
    const html = renderToStaticMarkup(<BlockSequencePractice page={{
      ...page, blocks: [page.blocks[0], "<img src=x onerror=alert(1)> conceitos são símbolos"],
    }} />);
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<form");
    expect(html).toContain("nenhuma resposta é enviada ou salva");
  });

  it("does not fabricate steps for a page with insufficient source content", () => {
    render(<BlockSequencePractice page={{ ...page, blocks: ["Um só parágrafo para estudar."] }} />);
    expect(screen.getByRole("status")).toHaveTextContent("trechos suficientes");
    expect(screen.queryByRole("button", { name: "Conferir sequência" })).not.toBeInTheDocument();
  });
});
