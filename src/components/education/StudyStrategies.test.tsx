// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StudyStrategies } from "./StudyStrategies";

describe("StudyStrategies", () => {
  it("offers accessible choices and contextual guidance without recording progress", () => {
    render(<StudyStrategies onClose={vi.fn()} />);
    expect(screen.getByRole("group", { name: "Escolha uma estratégia" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Limpar escolha" })).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: "Criar exemplos" }));
    expect(screen.getByText(/crie um exemplo próprio/)).toBeInTheDocument();
    expect(screen.getByText(/Nenhuma conclusão é registrada/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Limpar escolha" }));
    expect(screen.getByText("Selecione uma estratégia para ver as orientações.")).toBeInTheDocument();
    expect(screen.getAllByRole("radio").every((element) => !(element as HTMLInputElement).checked)).toBe(true);
  });

  it("forgets the chosen strategy after closing and reopening", () => {
    const close = vi.fn();
    const view = render(<StudyStrategies onClose={close} />);
    fireEvent.click(screen.getByRole("radio", { name: "Conectar ideias" }));
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao editor" }));
    expect(close).toHaveBeenCalledOnce();
    view.unmount();
    render(<StudyStrategies onClose={vi.fn()} />);
    expect(screen.getByText("Selecione uma estratégia para ver as orientações.")).toBeInTheDocument();
  });
});
