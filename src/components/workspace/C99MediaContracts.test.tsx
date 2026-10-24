// @vitest-environment jsdom

import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { Page, PageContent } from "@/domains/learning";
import { PageEditor } from "./PageEditor";
import { AccessiblePageReadingPreview, readableBlockType } from "./AccessiblePageReadingPreview";
import { serializeAccessiblePageText } from "./AccessiblePageTextExport";
import { serializeStructuredPage } from "./AccessiblePageStructuredExport";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const content: PageContent = {
  type: "document",
  blocks: [
    { type: "audio", content: "arquivo-local-nao-publicado.mp3", accessibility: {
      description: "Transcrição fornecida pelo estudante: introdução à astronomia.",
    } },
    { type: "notation-experimental", content: "Dó Ré Mi", accessibility: {
      description: "Três notas ascendentes, escritas pelo estudante.",
    } },
    { type: "image", content: "moldura.png", accessibility: { decorative: true } },
  ],
};

describe("C99 — inclusive multimedia/free-type reading contracts", () => {
  test("audio and user-defined block types retain their identity in text and reading preview", () => {
    render(<AccessiblePageReadingPreview content={content} />);
    expect(screen.getByRole("region", { name: "Leitura estruturada da página" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Bloco 1 — Áudio/ })).toBeTruthy();
    expect(screen.getByText("Transcrição ou descrição do áudio:")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Bloco 2 — Tipo livre: notation-experimental/ })).toBeTruthy();
    expect(screen.getByText("Três notas ascendentes, escritas pelo estudante.")).toBeTruthy();
    expect(screen.queryByText("moldura.png")).toBeNull();

    const txt = serializeAccessiblePageText("Aula sintética", content);
    expect(txt).toContain("Bloco 1 — Áudio — referência textual");
    expect(txt).toContain("Transcrição ou descrição do áudio: Transcrição fornecida pelo estudante");
    expect(txt).toContain("Tipo livre: notation-experimental");
    expect(txt).not.toContain("moldura.png");

    const roundTrip = JSON.parse(serializeStructuredPage("Aula sintética", content));
    expect(roundTrip.content).toEqual(content);
    expect(roundTrip.content.blocks[2].accessibility.decorative).toBe(true);
    expect(readableBlockType("notation-experimental")).toBe("Tipo livre: notation-experimental");
  });

  test("audio is selectable, accessible text is editable, and save stays explicit", () => {
    const page: Page = {
      id: "c99-audio", chapterId: "c99-chapter", title: "Áudio de estudo",
      content: { type: "document", blocks: [{ type: "paragraph", content: "Referência sonora local" }] },
      position: 0, createdAt: "2026-01-01", updatedAt: "2026-01-01",
    };
    const onSave = vi.fn(async (value: { id: string; title: string; content: PageContent }) => ({
      ...page, ...value,
    }));
    render(<PageEditor
      page={page}
      canMoveUp={false}
      canMoveDown={false}
      onMove={async () => undefined}
      onDelete={async () => undefined}
      onSave={onSave}
    />);
    fireEvent.click(screen.getByText("Acessibilidade do bloco 1"));
    const blockType = screen.getByRole("combobox", { name: "Tipo do bloco 1" });
    expect(within(blockType).getByRole("option", { name: "Áudio — referência textual" })).toBeTruthy();
    fireEvent.change(blockType, { target: { value: "audio" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Transcrição ou descrição do áudio" }), {
      target: { value: "Transcrição redigida pela autora." },
    });
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    // The async action is observed via its returned fulfilled Promise.
    return vi.waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave.mock.calls[0][0].content.blocks[0]).toEqual({
        type: "audio",
        content: "Referência sonora local",
        accessibility: { description: "Transcrição redigida pela autora.", decorative: false },
      });
    });
  });
});
