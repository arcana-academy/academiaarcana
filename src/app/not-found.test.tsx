import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NotFound from "./not-found";

describe("NotFound", () => {
  it("shows a Portuguese, accessible recovery path for unknown routes", () => {
    render(<NotFound />);

    const main = screen.getByRole("main", { name: "Página não encontrada" });
    expect(
      within(main).getByRole("heading", {
        level: 1,
        name: "Página não encontrada",
      }),
    ).toHaveAttribute("id", "not-found-title");

    const recovery = within(main).getByRole("navigation", {
      name: "Recuperar a navegação",
    });

    expect(
      within(recovery).getByRole("link", { name: "Voltar ao início" }),
    ).toHaveAttribute("href", "/");
    expect(
      within(recovery).getByRole("link", { name: "Abrir Santuário" }),
    ).toHaveAttribute("href", "/santuario");
  });

  it("renders the existing institutional seal as decorative, not duplicate narration", () => {
    const { container } = render(<NotFound />);

    const seal = container.querySelector("img");
    expect(seal).not.toBeNull();
    expect(seal).toHaveAttribute("alt", "");
    expect(seal?.getAttribute("src")).toContain("aa-institutional-seal.svg");
  });
});
