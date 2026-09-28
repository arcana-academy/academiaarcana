import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PerfilPage from "./page";

describe("PerfilPage", () => {
  it("renders identity and privacy entry points", () => {
    render(<PerfilPage />);
    expect(screen.getByRole("heading", { name: "Perfil", level: 1 })).toBeInTheDocument();
    const settingsLinks = screen.getAllByRole("link", { name: "Configurações" });
    expect(settingsLinks.some((link) => link.getAttribute("href") === "/configuracoes")).toBe(true);
  });
});
