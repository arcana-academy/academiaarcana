// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppShell } from "./AppShell";

vi.mock("@/lib/auth/actions", () => ({
  signOut: vi.fn(),
}));

describe("AppShell", () => {
  it("provides a single desktop primary navigation plus a distinct mobile navigation", () => {
    render(
      <AppShell currentPath="/santuario">
        <main>
          <h1>Conteúdo principal</h1>
        </main>
      </AppShell>,
    );

    expect(
      screen.getByRole("navigation", { name: "Navegação principal" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Navegação móvel" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Academia Arcana — ir para o Santuário",
      }),
    ).toHaveAttribute("href", "/santuario");
  });

  it("exposes a keyboard-accessible skip link and preserves the child main landmark", () => {
    render(
      <AppShell currentPath="/academia">
        <main aria-labelledby="content-title">
          <h1 id="content-title">Conteúdo principal</h1>
        </main>
      </AppShell>,
    );

    expect(
      screen.getByRole("link", { name: "Pular para o conteúdo principal" }),
    ).toHaveAttribute("href", "#main-content");
    expect(
      screen.getByRole("main", { name: "Conteúdo principal" }),
    ).toBeInTheDocument();
  });
});
