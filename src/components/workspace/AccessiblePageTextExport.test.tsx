// @vitest-environment jsdom

import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Page, PageContent } from "@/domains/learning";
import { PageEditor } from "./PageEditor";
import {
  AccessiblePageTextExport,
  accessibleTextFilename,
  serializeAccessiblePageText,
} from "./AccessiblePageTextExport";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(URL, "createObjectURL");
  Reflect.deleteProperty(URL, "revokeObjectURL");
});

describe("C97 — voluntary private text export", () => {
  const content: PageContent = {
    type: "document",
    blocks: [
      { type: "paragraph", content: "Minhas observações.\nOutra linha." },
      { type: "image", content: "Referência de imagem", accessibility: { description: "Gráfico com resultados." } },
      { type: "image", content: "Ornamento oculto", accessibility: { decorative: true } },
      { type: "video", content: "Vídeo referenciado", accessibility: { description: "Transcrição redigida pelo autor." } },
      { type: "formula", content: "E = mc²", accessibility: { description: "Energia igual a massa vezes c ao quadrado." } },
      { type: "diagram", content: "" },
    ],
  };

  test("preserves reading order, multiline text, author alternatives and missing-alt warnings", () => {
    const text = serializeAccessiblePageText("  Ciências e artes  ", content);
    expect(text.startsWith("Ciências e artes\n")).toBe(true);
    expect(text).toContain("Minhas observações.\nOutra linha.");
    expect(text).toContain("Descrição da imagem: Gráfico com resultados.");
    expect(text).toContain("Transcrição ou descrição do vídeo: Transcrição redigida pelo autor.");
    expect(text).toContain("Leitura da fórmula: Energia igual a massa vezes c ao quadrado.");
    expect(text).toContain("Referência ainda não informada.");
    expect(text).toContain("Alternativa acessível ainda não informada.");
    expect(text).not.toContain("Ornamento oculto");
    expect(text).toContain("não contém mídias");
  });

  test("produces filenames without paths, control chars or special URL syntax", () => {
    expect(accessibleTextFilename("../Anotações: Órbita/\\?")).toBe("anotacoes-orbita.txt");
    expect(accessibleTextFilename("..")).toBe("pagina-grimorio.txt");
    expect(accessibleTextFilename("")).toBe("pagina-grimorio.txt");
    expect(accessibleTextFilename("a".repeat(120)).length).toBeLessThanOrEqual(68);
  });

  test("does not download before a click and truthfully reports unavailable browser API", () => {
    const create = vi.fn(() => { throw new Error("Unavailable"); });
    Object.defineProperty(URL, "createObjectURL", { value: create, configurable: true });
    render(<AccessiblePageTextExport title="Página" content={content} />);
    expect(create).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Baixar texto acessível desta página (.txt)" }));
    expect(create).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível preparar o arquivo neste navegador.");
  });

  test("downloading current unsaved draft never calls the authenticated save", async () => {
    const page: Page = {
      id: "synthetic-c97", chapterId: "synthetic-chapter",
      title: "Página pessoal",
      content: { type: "document", blocks: [{ type: "paragraph", content: "Texto original" }] },
      position: 0, createdAt: "2026-01-01", updatedAt: "2026-01-01",
    };
    const create = vi.fn(() => "blob:synthetic-c97");
    const revoke = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: create, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revoke, configurable: true });
    let downloadedName = "";
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function(this: HTMLAnchorElement) {
      downloadedName = this.download;
    });
    const onSave = vi.fn();
    render(
      <PageEditor page={page} onSave={onSave}
        onMove={async () => undefined}
        onDelete={async () => undefined}
        canMoveUp={false} canMoveDown={false} />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Bloco 1" }), {
      target: { value: "Novo texto ainda não salvo" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Baixar texto acessível desta página (.txt)" }));
    expect(create).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(downloadedName).toBe("pagina-pessoal.txt");
    expect(onSave).not.toHaveBeenCalled();
    await waitFor(() => expect(revoke).toHaveBeenCalledWith("blob:synthetic-c97"));
  });
});
