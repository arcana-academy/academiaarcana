import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ConfiguracoesPage from "./page";

vi.mock("@/lib/auth/require-authenticated-user", () => ({ requireAuthenticatedUser: vi.fn(async () => ({sub:"synthetic-user"})) }));
vi.mock("@/lib/auth/actions", () => ({ signOut: vi.fn() }));

describe("C106 settings visual contract", () => {
  it("uses real existing theme/accessibility destinations rather than inert theme toggles", async () => {
    render(await ConfiguracoesPage());
    expect(screen.getByRole("navigation", { name: "Seções de configurações" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Escolher tema" })).toHaveAttribute("href","/personalizar");
    expect(screen.getByRole("link", { name: "Ajustar acessibilidade" })).toHaveAttribute("href","/personalizar");
    expect(screen.getByRole("link", { name: "Consultar perfil" })).toHaveAttribute("href","/perfil");
    expect(screen.getByRole("link", { name: "Gerenciar Todoist" })).toHaveAttribute("href","/integracoes/todoist");
  });
});
