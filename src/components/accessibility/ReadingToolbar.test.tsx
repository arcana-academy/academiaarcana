// @vitest-environment jsdom

import { afterEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@/design-system/themes";
import { VisualAccessibilityProvider } from "./AccessibilityPanel";
import { PageEditor } from "@/components/workspace/PageEditor";
import type { Page } from "@/domains/learning";

const page: Page = {
  id: "synthetic-page",
  chapterId: "synthetic-chapter",
  title: "Ciclo da água",
  content: { type: "document", blocks: [{ type: "paragraph", content: "A água evapora." }] },
  position: 0,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

describe("Brand Book compact grimoire reading toolbar", () => {
  afterEach(() => {
    window.localStorage.removeItem("academia-arcana.visual-accessibility-v1");
    document.documentElement.removeAttribute("data-aa-text-size");
    document.documentElement.removeAttribute("data-aa-focus");
  });

  test("uses global accessibility state without changing the saved page", async () => {
    const onSave = vi.fn();
    render(
      <ThemeProvider>
        <VisualAccessibilityProvider>
          <PageEditor
            page={page}
            canMoveUp={false}
            canMoveDown={false}
            onMove={vi.fn(async () => undefined)}
            onDelete={vi.fn(async () => undefined)}
            onSave={onSave}
          />
        </VisualAccessibilityProvider>
      </ThemeProvider>,
    );

    const toolbar = screen.getByRole("group", { name: "Barra de leitura do grimório" });
    expect(toolbar).toBeTruthy();
    const amplify = screen.getByRole("button", { name: "Ampliar tamanho do texto" });
    const reset = screen.getByRole("button", { name: "Restaurar tamanho padrão do texto" });
    expect((reset as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(amplify);
    await waitFor(() =>
      expect(document.documentElement.dataset.aaTextSize).toBe("large"),
    );
    expect((amplify as HTMLButtonElement).disabled).toBe(true);

    const focusButton = screen.getByRole("button", { name: "Modo Foco" });
    fireEvent.click(focusButton);
    await waitFor(() =>
      expect(document.documentElement.dataset.aaFocus).toBe("true"),
    );
    expect(focusButton.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByText("Mais ajustes"));
    expect(screen.getByRole("link", { name: "Central completa de Acessibilidade" })
      .getAttribute("href")).toBe("/configuracoes#acessibilidade");

    fireEvent.click(reset);
    await waitFor(() =>
      expect(document.documentElement.dataset.aaTextSize).toBe("normal"),
    );
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Bloco 1")).toHaveProperty("value", "A água evapora.");
  });
});
