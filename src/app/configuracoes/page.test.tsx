import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(async () => ({ sub: "user-1" })),
}));

vi.mock("@/components/accessibility/AccessibilityCenter", () => ({
  AccessibilityCenter: () => <button type="button">Acessibilidade</button>,
}));
vi.mock("@/components/accessibility/SettingsPreferences", () => ({
  SettingsPreferences: () => <div aria-label="Preferências de aparência e leitura">Preferências configuráveis</div>,
}));

import ConfiguracoesPage from "./page";

describe("ConfiguracoesPage", () => {
  it("renders accessibility, appearance and security sections", async () => {
    render(await ConfiguracoesPage());
    expect(screen.getByRole("heading", { name: "Configurações", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Acessibilidade", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Aparência", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Segurança", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ajustar aparência" })).toHaveAttribute("href", "#preferencias-de-leitura");
    expect(screen.getByRole("link", { name: "Gerenciar Asana" })).toHaveAttribute("href", "/integracoes/asana");
  });
});
