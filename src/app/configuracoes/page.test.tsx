import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ConfiguracoesPage from "./page";

describe("ConfiguracoesPage", () => {
  it("renders accessibility, appearance and security sections", () => {
    render(<ConfiguracoesPage />);
    expect(screen.getByRole("heading", { name: "Configurações" })).toBeInTheDocument();
    expect(screen.getByText(/Acessibilidade/)).toBeInTheDocument();
    expect(screen.getByText(/Aparência/)).toBeInTheDocument();
    expect(screen.getByText(/Segurança/)).toBeInTheDocument();
  });
});
