// @vitest-environment jsdom

import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Page, PageContent } from "@/domains/learning";
import { PageEditor } from "./PageEditor";
import { AccessiblePageReadingPreview } from "./AccessiblePageReadingPreview";
import { serializeAccessiblePageText } from "./AccessiblePageTextExport";
import { serializeStructuredPage } from "./AccessiblePageStructuredExport";
import {
  KNOWN_BLOCK_TYPES,
  accessibilityFieldLabel,
  accessibleBlockTypeLabel,
  readingAlternativeLabel,
  retagBlockPreservingAuthoredDescription,
} from "./accessible-block-contract";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const testPage = (blocks: PageContent["blocks"]): Page => ({
  id: "c99-synthetic-page", chapterId: "c99-chapter",
  title: "Referências de estudo",
  content: { type: "document", blocks },
  position: 0, createdAt: "2026-01-01", updatedAt: "2026-01-01",
});

function editor(page: Page, onSave = vi.fn(async (input: {
  id: string; title: string; content: PageContent;
}) => ({ ...page, ...input }))) {
  render(<PageEditor page={page} onSave={onSave}
    onMove={async () => undefined} onDelete={async () => undefined}
    canMoveUp={false} canMoveDown={false} />);
  return onSave;
}

describe("C99 — multimodal accessible contracts, without network media", () => {
  test("names audio and unknown free types without losing their identity", () => {
    expect(KNOWN_BLOCK_TYPES.map(t => t.id)).toEqual([
      "paragraph", "image", "audio", "video", "formula", "diagram",
    ]);
    expect(accessibilityFieldLabel("audio")).toBe("Transcrição ou descrição do áudio");
    expect(readingAlternativeLabel("audio")).toBe("Transcrição ou descrição do áudio:");
    expect(accessibleBlockTypeLabel("audio")).toContain("Áudio");
    expect(accessibleBlockTypeLabel("music-score")).toBe("Tipo livre: music-score");
    expect(readingAlternativeLabel("music-score")).toBe("Descrição acessível do tipo livre:");
  });

  test("retagging preserves authored descriptions, not obsolete decorative flags", () => {
    const original = { type: "image", content: "reference.wav", accessibility: {
      description: "Descrição original do estudante.", decorative: false,
    } };
    const converted = retagBlockPreservingAuthoredDescription(original, "audio");
    expect(converted.type).toBe("audio");
    expect(converted.accessibility).toEqual({
      description: "Descrição original do estudante.", decorative: false,
    });
    expect(original.type).toBe("image");
    expect(retagBlockPreservingAuthoredDescription({
      type: "image", content: "ornament", accessibility: { decorative: true, description: "" },
    }, "diagram").accessibility).toBeUndefined();
  });

  test("editor permits audio reference with author transcript, requiring an explicit save", async () => {
    const page = testPage([{ type: "image", content: "arquivo-apenas-referenciado", accessibility: {
      description: "Transcrição original, não deve desaparecer.", decorative: false,
    } }]);
    const onSave = editor(page);
    const selector = screen.getByRole("combobox", { name: "Tipo do bloco 1" });
    expect(screen.getByRole("option", { name: "Áudio — referência textual" })).toBeTruthy();
    fireEvent.change(selector, { target: { value: "audio" } });
    const alt = screen.getByRole("textbox", { name: "Transcrição ou descrição do áudio" });
    expect(alt).toHaveValue("Transcrição original, não deve desaparecer.");
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].content.blocks[0]).toMatchObject({
      type: "audio",
      accessibility: { description: "Transcrição original, não deve desaparecer." },
    });
  });

  test("audio and free types retain their labels and alternatives in both reading and exports", () => {
    const content: PageContent = { type: "document", blocks: [
      { type: "audio", content: "referencia-sonora-local", accessibility: { description: "Som explicado pelo autor." } },
      { type: "music-score", content: "Notas na pauta.", accessibility: { description: "Três notas ascendentes." } },
      { type: "diagram", content: "Ciclo da água", accessibility: { description: "Etapas de evaporação e precipitação." } },
    ] };
    const { container } = render(<AccessiblePageReadingPreview content={content} />);
    expect(screen.getByRole("region", { name: "Leitura estruturada da página" })).toBeTruthy();
    expect(screen.getByText(/Bloco 1 — Áudio/)).toBeTruthy();
    expect(screen.getByText(/Bloco 2 — Tipo livre: music-score/)).toBeTruthy();
    expect(screen.getByText("Som explicado pelo autor.")).toBeTruthy();
    expect(container.querySelector("audio, video, iframe, img")).toBeNull();
    const txt = serializeAccessiblePageText("Estudos", content);
    expect(txt).toContain("Bloco 1 — Áudio — referência textual");
    expect(txt).toContain("Transcrição ou descrição do áudio: Som explicado pelo autor.");
    expect(txt).toContain("Bloco 2 — Tipo livre: music-score");
    expect(txt).toContain("Descrição acessível do tipo livre: Três notas ascendentes.");
    const json = JSON.parse(serializeStructuredPage("Estudos", content));
    expect(json.content).toEqual(content);
  });

  test("existing unknown type is selectable and its description can be edited without a type conversion", async () => {
    const page = testPage([{
      type: "instrumento-tradicional",
      content: "Informação original sobre a melodia",
      accessibility: { description: "Explicação já existente." },
    }]);
    const onSave = editor(page);
    expect(screen.getByRole("option", { name: "Tipo existente: instrumento-tradicional" })).toBeTruthy();
    const textarea = screen.getByRole("textbox", { name: "Descrição acessível do tipo livre" });
    fireEvent.change(textarea, { target: { value: "Explicação revisada pelo estudante." } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].content.blocks[0].type).toBe("instrumento-tradicional");
    expect(onSave.mock.calls[0][0].content.blocks[0].accessibility?.description)
      .toBe("Explicação revisada pelo estudante.");
  });
});
