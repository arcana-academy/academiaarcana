// @vitest-environment jsdom

import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Page, PageContent } from "@/domains/learning";
import { PageEditor } from "./PageEditor";
import {
  AccessiblePageStructuredExport,
  serializeStructuredPage,
  structuredPageFilename,
} from "./AccessiblePageStructuredExport";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(URL, "createObjectURL");
  Reflect.deleteProperty(URL, "revokeObjectURL");
});

describe("C98 — opt-in structured grimoire draft export", () => {
  const content: PageContent = {
    type: "document",
    blocks: [
      { type: "paragraph", content: "Meu texto\\ncom linhas." },
      { type: "image", content: "referencia/imagem.jpg", accessibility: { description: "Estrelas no céu.", decorative: false } },
      { type: "image", content: "ornamento.png", accessibility: { decorative: true } },
      { type: "video", content: "video-exemplo", accessibility: { description: "Transcrição completa." } },
      { type: "formula", content: "E = mc²", accessibility: { description: "Energia igual a massa vezes a velocidade da luz ao quadrado." } },
      { type: "music", content: "C4 D4 E4", accessibility: { description: "Sequência de três notas." } },
    ],
  };

  test("preserves all blocks, their order, decorative flags and unknown types without mutation", () => {
    const snapshot = JSON.stringify(content);
    const result = JSON.parse(serializeStructuredPage("Anotações", content));
    expect(result.format).toBe("academia-arcana-page-draft");
    expect(result.version).toBe(1);
    expect(result.title).toBe("Anotações");
    expect(result.content).toEqual(content);
    expect(result.content.blocks[2].accessibility.decorative).toBe(true);
    expect(result.content.blocks[5].type).toBe("music");
    expect(JSON.stringify(content)).toBe(snapshot);
  });

  test("reuses the proven sanitized file naming policy", () => {
    expect(structuredPageFilename("../Anotações: Órbita")).toBe("anotacoes-orbita.json");
    expect(structuredPageFilename("..")).toBe("pagina-grimorio.json");
    expect(structuredPageFilename("")).toBe("pagina-grimorio.json");
  });

  test("does not initiate any download before click and reports denied browser APIs", () => {
    const create = vi.fn(() => { throw new Error("Downloads blocked"); });
    Object.defineProperty(URL, "createObjectURL", { value: create, configurable: true });
    render(<AccessiblePageStructuredExport title="Meu grimório" content={content} />);
    expect(create).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Baixar dados estruturados desta página (.json)" }));
    expect(create).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível preparar a cópia estruturada neste navegador.");
  });

  test("reads an unsaved editor draft without triggering server save", () => {
    const page: Page = {
      id: "synthetic-c98", chapterId: "synthetic-chapter", title: "Meu caderno",
      content: { type: "document", blocks: [{ type: "paragraph", content: "Texto original" }] },
      position: 0, createdAt: "2026-01-01", updatedAt: "2026-01-01",
    };
    const create = vi.fn(() => "blob:synthetic-c98");
    Object.defineProperty(URL, "createObjectURL", { value: create, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: vi.fn(), configurable: true });
    let name = "";
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function(this: HTMLAnchorElement) {
      name = this.download;
    });
    const onSave = vi.fn();
    render(
      <PageEditor page={page} onSave={onSave}
        onMove={async () => undefined}
        onDelete={async () => undefined}
        canMoveUp={false} canMoveDown={false}
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Bloco 1" }), {
      target: { value: "Rascunho recém-editado" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Baixar dados estruturados desta página (.json)" }));
    expect(create).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(name).toBe("meu-caderno.json");
    expect(onSave).not.toHaveBeenCalled();
  });
});
