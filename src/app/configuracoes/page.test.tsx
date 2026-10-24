import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/design-system/themes";

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(async () => ({ sub: "user-1" })),
}));

import ConfiguracoesPage from "./page";

describe("ConfiguracoesPage", () => {
  it("routes accessibility and appearance actions to the existing personalization controls", async () => {
    render(await ConfiguracoesPage());

    expect(screen.getByRole("link", { name: "Ajustar movimento" })).toHaveAttribute(
      "href",
      "/personalizar#motion-select",
    );
    expect(screen.getByRole("link", { name: "Escolher tema" })).toHaveAttribute(
      "href",
      "/personalizar#theme-select",
    );
  });

  it("renders accessibility, appearance and security sections", async () => {
    render(<ThemeProvider>{await ConfiguracoesPage()}</ThemeProvider>);
    expect(screen.getByRole("heading", { name: "Configurações", level: 1 })).toBeInTheDocument();
    expect(screen.getAllByText(/Acessibilidade/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Aparência/)[0]).toBeInTheDocument();
    expect(screen.getByText(/Segurança/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ajustar movimento" })).toHaveAttribute("href", "/personalizar#motion-select");
    expect(screen.getByRole("link", { name: "Escolher tema" })).toHaveAttribute("href", "/personalizar#theme-select");
    expect(screen.getByRole("link", { name: "Gerenciar Asana" })).toHaveAttribute("href", "/integracoes/asana");
  });
});
