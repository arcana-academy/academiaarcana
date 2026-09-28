import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PerfilPage from "./page";

describe("PerfilPage", () => {
  it("renders identity and privacy entry points", () => {
    render(<PerfilPage />);
    expect(screen.getByRole("heading", { name: "Perfil" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Configurações" })).toHaveAttribute("href", "/configuracoes");
  });
});
