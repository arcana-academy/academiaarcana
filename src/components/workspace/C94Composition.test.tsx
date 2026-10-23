// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, useTheme } from "@/design-system/themes";
import { VisualAccessibilityProvider } from "@/components/accessibility/AccessibilityPanel";
import { PagePaperStyleView } from "./PagePaperStyleView";
import { PageFrameStyleView } from "./PageFrameStyleView";
import { PageEditor } from "./PageEditor";
import type { Page } from "@/domains/learning";

const page: Page = {
  id: "synthetic-C94",
  chapterId: "synthetic-chapter",
  title: "Ciências — exemplo sintético",
  content: { type: "document", blocks: [] },
  position: 0,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

function ThemeChoice() {
  const { setAppearance } = useTheme();
  return <button type="button" onClick={() => setAppearance("light")}>Tema claro C94</button>;
}

function Composite({ selectedPage, onSave }: {
  selectedPage: Page;
  onSave: (input: { id: string; title: string; content: Page["content"] }) => Promise<Page>;
}) {
  return (
    <ThemeProvider followSystem>
      <VisualAccessibilityProvider>
        <ThemeChoice />
        <PagePaperStyleView pageId={selectedPage.id}>
          <PageFrameStyleView pageId={selectedPage.id}>
            <PageEditor
              page={selectedPage}
              canMoveUp={false}
              canMoveDown={false}
              onMove={async () => undefined}
              onDelete={async () => undefined}
              onSave={onSave}
            />
          </PageFrameStyleView>
        </PagePaperStyleView>
      </VisualAccessibilityProvider>
    </ThemeProvider>
  );
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
  for (const key of ["data-aa-contrast", "data-aa-text-size", "data-aa-focus"]) {
    document.documentElement.removeAttribute(key);
  }
});

describe("C94 — focused composition interactions (no prior suites rerun)", () => {
  test("combines paper, frame, automatic theme override, reading and a template with explicit save", async () => {
    const onSave = vi.fn(async (input: { id: string; title: string; content: Page["content"] }) => ({
      ...page, ...input,
    }));
    const { container } = render(<Composite selectedPage={page} onSave={onSave} />);
    const paper = screen.getByRole("combobox", { name: "Estilo do papel desta página" });
    const frame = screen.getByRole("combobox", { name: "Moldura desta página" });
    expect(paper).toHaveValue("inherit");
    expect(frame).toHaveValue("none");

    fireEvent.change(paper, { target: { value: "pergaminho-antigo" } });
    fireEvent.change(frame, { target: { value: "medieval" } });
    expect(container.querySelector('.workspace-page-editor[data-aa-paper-style="pergaminho-antigo"] .workspace-page-frame[data-aa-frame-style="medieval"] > article')).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Tema claro C94" }));
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("pergaminho-claro"));
    fireEvent.click(screen.getByRole("button", { name: "Ampliar tamanho do texto" }));
    await waitFor(() => expect(document.documentElement.dataset.aaTextSize).toBe("large"));
    fireEvent.click(screen.getByRole("button", { name: "Modo Foco" }));
    await waitFor(() => expect(document.documentElement.dataset.aaFocus).toBe("true"));

    fireEvent.change(screen.getByRole("combobox", { name: "Modelo inicial" }), {
      target: { value: "illustrated" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar modelo" }));
    expect(screen.getByLabelText("Bloco 2")).toHaveProperty("value", "");
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].content.blocks.map((block) => block.type)).toEqual(["paragraph", "image", "paragraph"]);
    expect(window.localStorage.getItem("academia-arcana.page-paper.v1:synthetic-C94")).toBe("pergaminho-antigo");
    expect(window.localStorage.getItem("academia-arcana.page-frame.v1:synthetic-C94")).toBe("medieval");
  });

  test("changing both decorative preferences never replaces authored content", () => {
    const authored: Page = {
      ...page, id: "authored-C94",
      content: { type: "document", blocks: [{
        type: "paragraph",
        content: "Texto autoral preservado.",
        accessibility: { description: "Descrição acessível original." },
      }] },
    };
    const onSave = vi.fn(async (input: { id: string; title: string; content: Page["content"] }) => ({
      ...authored, ...input,
    }));
    const { container } = render(<Composite selectedPage={authored} onSave={onSave} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Estilo do papel desta página" }), {
      target: { value: "arcano-escuro" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Moldura desta página" }), {
      target: { value: "alchemy" },
    });
    expect(container.querySelector('.workspace-page-editor[data-aa-paper-style="arcano-escuro"] .workspace-page-frame[data-aa-frame-style="alchemy"]')).not.toBeNull();
    expect(screen.getByRole("button", { name: "Aplicar modelo" })).toBeDisabled();
    expect(screen.getByLabelText("Bloco 1")).toHaveProperty("value", "Texto autoral preservado.");
    expect(onSave).not.toHaveBeenCalled();
  });
});
