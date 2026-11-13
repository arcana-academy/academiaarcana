import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MvpPilot } from "./MvpPilot";
import { DEMO_STORAGE_KEY } from "./mvp-model";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

afterEach(() => { vi.unstubAllGlobals(); window.sessionStorage.clear(); });

describe("MVP synthetic journey pilot", () => {
  it("navigates from the Sanctuary to the grimoire, chapter and page", () => {
    render(<MvpPilot />);
    expect(screen.getByRole("heading", { level: 1, name: "Seu Santuário de estudos" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Grimórios" }));
    expect(screen.getByRole("heading", { name: "Seus grimórios" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Explorar capítulos" }));
    expect(screen.getByRole("heading", { level: 2, name: "Capítulos" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Como organizar seu estudo/ }));
    expect(screen.getByRole("heading", { name: "Como organizar seu estudo" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /Suas anotações/ })).toBeInTheDocument();
  });

  it("completes pages and reflects verified local progress", () => {
    render(<MvpPilot />);
    fireEvent.click(screen.getByRole("button", { name: "Páginas" }));
    fireEvent.click(screen.getByRole("button", { name: "Marcar como estudada" }));
    expect(screen.getByRole("button", { name: "Marcar como não estudada" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Santuário" }));
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("creates and completes a synthetic task, reflected in Missions", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "test-uuid" });
    render(<MvpPilot />);
    fireEvent.click(screen.getByRole("button", { name: "Cronograma" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Nova tarefa" }), {
      target: { value: "Revisar um grimório" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar tarefa" }));
    expect(screen.getByText("Revisar um grimório")).toBeInTheDocument();
    const row = screen.getByText("Revisar um grimório").closest("li");
    expect(row).not.toBeNull();
    const complete = row?.querySelector("button");
    expect(complete).toBeTruthy();
    if (!complete) throw new Error("Expected the synthetic task completion button.");
    fireEvent.click(complete);
    fireEvent.click(screen.getByRole("button", { name: "Missões" }));
    expect(screen.getByText("Revisar um grimório")).toBeInTheDocument();
    expect(screen.getAllByText("Concluída").length).toBeGreaterThan(0);
  });

  it("identifies synthetic data and links to the authenticated route", () => {
    render(<MvpPilot />);
    expect(screen.getByText(/dados fictícios em memória/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Acessar o módulo real/ })).toHaveAttribute("href", "/santuario");
    expect(screen.getByRole("link", { name: "Ir para conteúdo" })).toHaveAttribute("href", "#mvp-content");
  });
  it("isolates production links and labels the synthetic session", () => {
    render(<MvpPilot isolated />);
    expect(screen.queryByRole("link", { name: /Acessar o módulo real/ })).not.toBeInTheDocument();
    expect(screen.getByText(/O progresso fica somente nesta aba/)).toBeInTheDocument();
  });

  it("restores bounded sample progress in the same browser tab", async () => {
    window.sessionStorage.clear();
    const mounted = render(<MvpPilot isolated />);
    fireEvent.click(screen.getByRole("button", { name: "Páginas" }));
    fireEvent.click(screen.getByRole("button", { name: "Marcar como estudada" }));
    await waitFor(() => expect(window.sessionStorage.getItem(DEMO_STORAGE_KEY)).toContain("page-runas"));
    mounted.unmount();
    render(<MvpPilot isolated />);
    fireEvent.click(screen.getByRole("button", { name: "Santuário" }));
    await waitFor(() => expect(screen.getByText("1 / 3")).toBeInTheDocument());
  });

});