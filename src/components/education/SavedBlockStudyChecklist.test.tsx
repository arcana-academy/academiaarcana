// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SavedBlockStudyChecklist } from "./SavedBlockStudyChecklist";

const blocks = [
  { type: "paragraph" as const, content: " Primeiro texto " },
  { type: "paragraph" as const, content: "   " },
  { type: "paragraph" as const, content: "Segundo texto" },
];

describe("SavedBlockStudyChecklist", () => {
  it("lists only nonblank saved blocks and tracks temporary checkboxes", () => {
    render(<SavedBlockStudyChecklist title="História" blocks={blocks} onClose={vi.fn()} />);
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(screen.getByText("0 de 2 trechos marcados nesta tela.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Trecho 1" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Trecho 2" }));
    expect(screen.getByText("2 de 2 trechos marcados nesta tela.")).toBeInTheDocument();
    expect(screen.getByText(/Nenhum progresso foi salvo/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Limpar marcações" }));
    expect(screen.getByText("0 de 2 trechos marcados nesta tela.")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox").every((checkbox) => !(checkbox as HTMLInputElement).checked)).toBe(true);
  });

  it("does not execute HTML, handles empty pages and closes", () => {
    const onClose = vi.fn();
    const { container, rerender } = render(
      <SavedBlockStudyChecklist
        title="Segurança"
        blocks={[{ type: "paragraph", content: "<script>alert(1)</script>" }]}
        onClose={onClose}
      />,
    );
    expect(screen.getByText("<script>alert(1)</script>")).toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
    rerender(<SavedBlockStudyChecklist title="Vazia" blocks={[]} onClose={onClose} />);
    expect(screen.getByText("Esta página não possui trechos salvos para organizar.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao editor" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
