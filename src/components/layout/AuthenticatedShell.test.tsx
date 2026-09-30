import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuthenticatedShell } from "./AuthenticatedShell";

vi.mock("@/lib/auth/actions", () => ({
  signOut: vi.fn(),
}));

describe("AuthenticatedShell", () => {
  it("renders the application identity, navigation and sign-out action", () => {
    render(
      <AuthenticatedShell currentPath="/santuario">
        <main>
          <h1>Seu Santuário de aprendizagem</h1>
        </main>
      </AuthenticatedShell>,
    );

    expect(\n      screen.getByRole("link", { name: "Academia Arcana — Santuário" }),\n    ).toBeInTheDocument();
    expect(screen.getByText("Jornada de aprendizagem")).toBeInTheDocument();\n    const institutionalSeals = screen.getAllByRole("img", { name: "" });\n    expect(institutionalSeals).toHaveLength(2);\n    expect(institutionalSeals.every((image) => image.getAttribute("src") === "/assets/brand/aa-institutional-seal.svg")).toBe(true);
    expect(
      screen.getByRole("navigation", { name: "Navegação principal" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Seu Santuário de aprendizagem",
      }),
    ).toBeInTheDocument();
  });
});
