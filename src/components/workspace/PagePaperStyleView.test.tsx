// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Page } from "@/domains/learning";
import { PageEditor } from "./PageEditor";
import { PagePaperStyleView, pagePaperStorageKey } from "./PagePaperStyleView";

const page: Page = {
  id: "student-page-A",
  chapterId: "chapter-A",
  title: "Estudo de astronomia",
  content: { type: "document", blocks: [{ type: "paragraph", content: "Notas originais" }] },
  position: 0,
  createdAt: "2026-10-22",
  updatedAt: "2026-10-22",
};

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("Quatro papéis opcionais do grimório", () => {
  it("preserva a aparência existente até haver uma escolha explícita", () => {
    const { container } = render(
      <PagePaperStyleView pageId={page.id}><p>Conteúdo educacional</p></PagePaperStyleView>,
    );
    expect(screen.getByRole("combobox", { name: "Estilo do papel desta página" })).toHaveValue("inherit");
    expect(container.querySelector(".workspace-page-editor")).toHaveAttribute("data-aa-paper-style", "inherit");
    expect(screen.getAllByRole("option")).toHaveLength(5);
  });

  it("salva cada página separadamente sem afetar outra página", async () => {
    const first = render(
      <PagePaperStyleView pageId="student-page-A"><p>A</p></PagePaperStyleView>,
    );
    const selection = screen.getByRole("combobox", { name: "Estilo do papel desta página" });
    for (const value of ["pergaminho-antigo", "arcano-escuro", "lilas", "alquimista-antigo"]) {
      fireEvent.change(selection, { target: { value } });
      expect(first.container.querySelector(".workspace-page-editor")).toHaveAttribute("data-aa-paper-style", value);
      expect(window.localStorage.getItem(pagePaperStorageKey("student-page-A"))).toBe(value);
    }
    first.unmount();
    const second = render(
      <PagePaperStyleView pageId="student-page-B"><p>B</p></PagePaperStyleView>,
    );
    expect(screen.getByRole("combobox", { name: "Estilo do papel desta página" })).toHaveValue("inherit");
    second.unmount();
    render(<PagePaperStyleView pageId="student-page-A"><p>A2</p></PagePaperStyleView>);
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "Estilo do papel desta página" })).toHaveValue("alquimista-antigo"),
    );
  });

  it("não inclui o estilo nos dados enviados para salvar a página", async () => {
    const onSave = vi.fn(async (input: { id: string; title: string; content: Page["content"] }) => ({
      ...page, title: input.title, content: input.content,
    }));
    render(
      <PagePaperStyleView pageId={page.id}>
        <PageEditor page={page} canMoveUp={false} canMoveDown={false}
          onMove={vi.fn(async () => undefined)} onDelete={vi.fn(async () => undefined)} onSave={onSave} />
      </PagePaperStyleView>,
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Estilo do papel desta página" }), {
      target: { value: "lilas" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith({
      id: page.id,
      title: page.title,
      content: page.content,
    });
  });

  it("mantém a escolha utilizável se o navegador bloquear armazenamento", () => {
    window.localStorage.setItem(pagePaperStorageKey("nonpersistent-page"), "pergaminho-antigo");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    const { container, rerender } = render(
      <PagePaperStyleView pageId="nonpersistent-page"><p>A</p></PagePaperStyleView>,
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Estilo do papel desta página" }), {
      target: { value: "arcano-escuro" },
    });
    expect(container.querySelector(".workspace-page-editor")).toHaveAttribute("data-aa-paper-style", "arcano-escuro");
    expect(screen.getByRole("status")).toHaveTextContent(/não foi possível salvar/i);

    rerender(<PagePaperStyleView pageId="other-page"><p>B</p></PagePaperStyleView>);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("isola as preferências de outras chaves de armazenamento", () => {
    window.localStorage.setItem("academia-arcana.reading-preferences.v1", '{"largeText":true}');
    render(<PagePaperStyleView pageId="style-only"><p>A</p></PagePaperStyleView>);
    fireEvent.change(screen.getByRole("combobox", { name: "Estilo do papel desta página" }), {
      target: { value: "pergaminho-antigo" },
    });
    expect(window.localStorage.getItem("academia-arcana.reading-preferences.v1")).toBe('{"largeText":true}');
  });
});
