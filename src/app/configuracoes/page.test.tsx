import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(async () => ({ sub: "user-1" })),
}));

import ConfiguracoesPage from "./page";

describe("ConfiguracoesPage", () => {
  it("renders accessibility, appearance and security sections", async () => {
    render(await ConfiguracoesPage());
    expect(screen.getByRole("heading", { name: "Configurações", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Acessibilidade/)).toBeInTheDocument();
    expect(screen.getByText(/Aparência/)).toBeInTheDocument();
    expect(screen.getByText(/Segurança/)).toBeInTheDocument();
  });
});
