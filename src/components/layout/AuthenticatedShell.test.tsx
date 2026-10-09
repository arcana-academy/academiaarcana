import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuthenticatedShell } from "./AuthenticatedShell";

vi.mock("@/lib/auth/actions", () => ({
  signOut: vi.fn(),
}));

describe("AuthenticatedShell", () => {
  it("renders the application identity, navigation and sign-out action", () => {
    const { container } = render(
      <AuthenticatedShell currentPath="/santuario">
        <main>
          <h1>Seu Santuário de aprendizagem</h1>
        </main>
      </AuthenticatedShell>,
    );

    expect(
      screen.getByRole("link", { name: "Academia Arcana — Santuário" }),
    ).toBeInTheDocument();
    const topbarContext = container.querySelector(".aa-topbar-context");
    expect(topbarContext).toHaveTextContent("Academia Arcana/Santuário");
    const institutionalSeals = container.querySelectorAll('img[src="/assets/brand/aa-institutional-seal.svg"]');
    expect(institutionalSeals).toHaveLength(2);
    expect(Array.from(institutionalSeals).every((image) => image.getAttribute("src") === "/assets/brand/aa-institutional-seal.svg")).toBe(true);
    const flontsPortrait = container.querySelector('img[src="/assets/flonts/flonts-mago-mini-96.webp"]');
    expect(flontsPortrait).toBeInTheDocument();
    expect(flontsPortrait).toHaveAttribute("width", "48");
    expect(flontsPortrait).toHaveAttribute("height", "60");
    expect(screen.getByText("Flonts está com você")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Navegação principal" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Seu Santuário de aprendizagem",
      }),
    ).toBeInTheDocument();
  });

  it("reflects the current area in the topbar context", () => {
    const { container } = render(
      <AuthenticatedShell currentPath="/amigos">
        <main>Conteúdo social</main>
      </AuthenticatedShell>,
    );

    const topbar = container.querySelector(".aa-topbar-context");
    expect(topbar).toHaveTextContent("Academia Arcana/Amigos");
    expect(topbar).not.toHaveTextContent("Jornada de aprendizagem");
  });
});
