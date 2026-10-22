// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ReadingTools } from "./ReadingTools";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-aa-text-scale");
  document.documentElement.removeAttribute("data-aa-spacing");
  document.documentElement.removeAttribute("data-aa-contrast");
  document.documentElement.removeAttribute("data-aa-focus-mode");
});

describe("Ajustes de leitura do grimório", () => {
  it("keeps adjustments collapsed until the student requests them", () => {
    render(<ReadingTools />);
    const button = screen.getByRole("button", { name: "Ajustes de leitura" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("checkbox", { name: "Ampliar texto" })).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("checkbox", { name: "Ampliar texto" })).toBeInTheDocument();
  });

  it("shares the same saved reading preferences with the header", async () => {
    render(<ReadingTools />);
    fireEvent.click(screen.getByRole("button", { name: "Ajustes de leitura" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Ampliar texto" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Aumentar espaçamento" }));
    const serialized = window.localStorage.getItem("academia-arcana.reading-preferences.v1");
    expect(JSON.parse(serialized ?? "{}")).toMatchObject({
      largeText: true,
      extraSpacing: true,
    });
    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-aa-text-scale", "large");
      expect(document.documentElement).toHaveAttribute("data-aa-spacing", "wide");
    });
    expect(screen.getByText(/sem alterar ou salvar o conteúdo da página/i)).toBeInTheDocument();
  });
});
