// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { ThemeProvider } from "@/design-system/themes";
import { AccessibilityPanel, VisualAccessibilityProvider } from "./AccessibilityPanel";

function renderPanel(variant: "quick" | "full") {
  return render(
    <ThemeProvider followSystem>
      <VisualAccessibilityProvider>
        <AccessibilityPanel variant={variant} />
      </VisualAccessibilityProvider>
    </ThemeProvider>,
  );
}

describe("Academia Arcana visual accessibility", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-aa-text-size");
    document.documentElement.removeAttribute("data-aa-contrast");
    document.documentElement.removeAttribute("data-aa-spacing");
    document.documentElement.removeAttribute("data-aa-focus");
    window.localStorage.removeItem("academia-arcana.visual-accessibility-v1");
    window.localStorage.removeItem("academia-arcana.appearance-v1");
  });

  test("exposes the four working quick controls and the full-center link", async () => {
    renderPanel("quick");
    fireEvent.click(screen.getByText("Acessibilidade"));
    expect(screen.getByRole("link", { name: /Central completa de Acessibilidade/ }))
      .toHaveAttribute("href", "/configuracoes#acessibilidade");
    fireEvent.click(screen.getByRole("checkbox", { name: /Texto maior/ }));
    await waitFor(() => expect(document.documentElement.dataset.aaTextSize).toBe("large"));
    fireEvent.click(screen.getByRole("checkbox", { name: /Contraste reforçado/ }));
    await waitFor(() => expect(document.documentElement.dataset.aaContrast).toBe("high"));
  });

  test("lists the six approved areas and allows a manual light-theme override", async () => {
    renderPanel("full");
    for (const name of [
      "Visão e leitura", "Audição e mídia", "Mobilidade e controle",
      "Cognição e concentração", "Tecnologias assistivas", "Estudo acessível",
    ]) expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Pergaminho Claro" }));
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("pergaminho-claro"));
    expect(document.documentElement.style.colorScheme).toBe("light");
  });
});
