// @vitest-environment jsdom

import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AccessiblePageReadingPreview } from "./AccessiblePageReadingPreview";
import { PageEditor } from "./PageEditor";
import type { Page, PageContent } from "@/domains/learning";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("C96 — accessible reading preview without uploads or HTML interpretation", () => {
  test("presents real author alternatives in semantic reading order", () => {
    const content: PageContent = {
      type: "document",
      blocks: [
        { type: "paragraph", content: "Primeira anotação." },
        { type: "image", content: "Imagem de estudo", accessibility: { description: "Representação de células.", decorative: false } },
        { type: "video", content: "Vídeo de referência", accessibility: { description: "Transcrição fornecida pela autora.", decorative: false } },
        { type: "formula", content: "x² + y²", accessibility: { description: "X ao quadrado mais Y ao quadrado.", decorative: false } },
        { type: "diagram", content: "Diagrama sintético" },
      ],
    };
    render(<AccessiblePageReadingPreview content={content} />);
    expect(screen.getByRole("region", { name: "Leitura estruturada da página" })).toBeTruthy();
    expect(screen.getByText("Primeira anotação.")).toBeTruthy();
    expect(screen.getByText("Representação de células.")).toBeTruthy();
    expect(screen.getByText("Transcrição fornecida pela autora.")).toBeTruthy();
    expect(screen.getByText("X ao quadrado mais Y ao quadrado.")).toBeTruthy();
    expect(screen.getByText("Alternativa acessível ainda não informada.")).toBeTruthy();
  });

  test("does not expose purely decorative images or render author text as HTML", () => {
    const content: PageContent = {
      type: "document",
      blocks: [
        { type: "image", content: "Ornamento que não deve aparecer.", accessibility: { decorative: true } },
        { type: "paragraph", content: "<img src='https://example.invalid/private'> Texto literal." },
      ],
    };
    const { container } = render(<AccessiblePageReadingPreview content={content} />);
    expect(screen.queryByText("Ornamento que não deve aparecer.")).toBeNull();
    expect(screen.getByText(/Texto literal/)).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
  });

  test("editor preview reads unsaved draft and never calls onSave", () => {
    const page: Page = {
      id: "c96-page", chapterId: "c96-chapter",
      title: "Página acessível",
      content: { type: "document", blocks: [{ type: "paragraph", content: "Texto inicial." }] },
      position: 0, createdAt: "2026-01-01", updatedAt: "2026-01-01",
    };
    const onSave = vi.fn(async (input: { id: string; title: string; content: PageContent }) => ({ ...page, ...input }));
    render(
      <PageEditor
        page={page}
        onSave={onSave}
        onMove={async () => undefined}
        onDelete={async () => undefined}
        canMoveUp={false}
        canMoveDown={false}
      />,
    );
    expect(screen.getByRole("group", { name: "Blocos da página" })).toBeTruthy();
    const summary = screen.getByText("Ver prévia de leitura acessível (rascunho local)");
    fireEvent.click(summary);
    fireEvent.change(screen.getByRole("textbox", { name: "Bloco 1" }), { target: { value: "Alterado sem salvar." } });
    const readingRegion = screen.getByRole("region", { name: "Leitura estruturada da página" });
    expect(readingRegion.querySelector(".workspace-reading-preview-plain")?.textContent)
      .toBe("Alterado sem salvar.");
    expect(onSave).not.toHaveBeenCalled();
  });
});
