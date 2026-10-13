// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TemporaryStudyGlossary } from "./TemporaryStudyGlossary";

describe("TemporaryStudyGlossary", () => {
  it("requires both fields and permits add, edit and remove without persistence", () => {
    render(<TemporaryStudyGlossary title="Biologia" onClose={vi.fn()} />);
    const add = screen.getByRole("button", { name: "Adicionar conceito" });
    expect(add).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Termo"), { target: { value: " Célula " } });
    fireEvent.change(screen.getByLabelText("Definição com suas palavras"), { target: { value: " Unidade viva " } });
    fireEvent.click(add);
    expect(screen.getByText("1 conceito(s) nesta tela.")).toBeInTheDocument();
    expect(screen.getByLabelText("Termo 1")).toHaveValue("Célula");
    fireEvent.change(screen.getByLabelText("Definição 1"), { target: { value: "Conceito revisado" } });
    expect(screen.getByLabelText("Definição 1")).toHaveValue("Conceito revisado");
    fireEvent.click(screen.getByRole("button", { name: "Remover conceito 1" }));
    expect(screen.getByText("0 conceito(s) nesta tela.")).toBeInTheDocument();
  });

  it("escapes entered markup and discards entries when closed and remounted", () => {
    const close = vi.fn();
    const view = render(<TemporaryStudyGlossary title="Teste" onClose={close} />);
    fireEvent.change(screen.getByLabelText("Termo"), { target: { value: "<img src=x>" } });
    fireEvent.change(screen.getByLabelText("Definição com suas palavras"), { target: { value: "<script>bad()</script>" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar conceito" }));
    expect(view.container.querySelector("img, script")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao editor" }));
    expect(close).toHaveBeenCalledOnce();
    view.unmount();
    render(<TemporaryStudyGlossary title="Teste" onClose={vi.fn()} />);
    expect(screen.getByText("0 conceito(s) nesta tela.")).toBeInTheDocument();
  });
});
