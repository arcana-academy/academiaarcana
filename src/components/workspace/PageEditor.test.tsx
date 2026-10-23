// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Page } from "@/domains/learning";
import { PageEditor } from "./PageEditor";

const page: Page = {
  id: "p1",
  chapterId: "c1",
  title: "Dor lombar",
  content: {
    type: "document",
    blocks: [{ type: "paragraph", content: "Conteúdo inicial." }],
  },
  position: 0,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

const movementProps = {
  canMoveUp: false,
  canMoveDown: false,
  onMove: vi.fn(() => Promise.resolve()),
};

type SaveInput = {
  id: string;
  title: string;
  content: Page["content"];
};

describe("PageEditor", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  test("adjusts reading presentation without altering the authenticated save payload", async () => {
    const onSave = vi.fn((input: SaveInput) => Promise.resolve({
      ...page,
      title: input.title,
      content: input.content,
    }));
    const { container } = render(
      <PageEditor
        {...movementProps}
        page={page}
        onDelete={vi.fn(() => Promise.resolve())}
        onSave={onSave}
      />,
    );

    fireEvent.click(screen.getByText("Ajustes de leitura"));
    fireEvent.change(screen.getByLabelText("Tamanho do texto"), { target: { value: "large" } });
    fireEvent.change(screen.getByLabelText("Fonte de leitura"), { target: { value: "literata" } });
    fireEvent.click(screen.getByLabelText("Contraste reforçado"));
    fireEvent.click(screen.getByLabelText("Maior espaçamento"));
    fireEvent.click(screen.getByLabelText("Modo Foco"));

    const editor = container.querySelector(".aa-reading-editor");
    expect(editor).toHaveAttribute("data-reading-size", "large");
    expect(editor).toHaveAttribute("data-reading-contrast", "true");
    expect(editor).toHaveAttribute("data-reading-spacing", "true");
    expect(editor).toHaveAttribute("data-reading-focus", "true");
    expect(editor).toHaveAttribute("data-reading-font", "literata");

    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith({
      id: page.id,
      title: page.title,
      content: page.content,
    });
    expect(screen.getByRole("button", { name: "Excluir página" })).toBeInTheDocument();
  });

  test("renders the selected page and saves title and content", async () => {
    const onSave = vi.fn((input: SaveInput) =>
      Promise.resolve({
        ...page,
        title: input.title,
        content: input.content,
        updatedAt: "2026-01-02",
      }),
    );

    render(
      <PageEditor
        {...movementProps}
        page={page}
        onDelete={vi.fn(() => Promise.resolve())}
        onSave={onSave}
      />,
    );

    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Dor lombar - revisão" },
    });
    fireEvent.change(screen.getByLabelText("Bloco 1"), {
      target: { value: "Conteúdo revisado." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith({
      id: "p1",
      title: "Dor lombar - revisão",
      content: {
        type: "document",
        blocks: [{ type: "paragraph", content: "Conteúdo revisado." }],
      },
    });
    expect(await screen.findByText("Página salva.")).toBeTruthy();
  });

  test("allows adding a paragraph block", () => {
    render(
      <PageEditor
        {...movementProps}
        page={page}
        onDelete={vi.fn(() => Promise.resolve())}
        onSave={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Adicionar bloco" }));

    expect(screen.getByLabelText("Bloco 2")).toBeTruthy();
  });

  test("shows a recovery message when saving fails", async () => {
    const onSave = vi.fn(() =>
      Promise.reject(new Error("save failed")),
    );

    render(
      <PageEditor
        {...movementProps}
        page={page}
        onDelete={vi.fn(() => Promise.resolve())}
        onSave={onSave}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));

    expect(
      await screen.findByText("Não foi possível salvar a página."),
    ).toBeTruthy();
  });

  test("opens a confirmation before deleting the selected page", () => {
    const onDelete = vi.fn(() => Promise.resolve());

    render(
      <PageEditor
        {...movementProps}
        page={page}
        onDelete={onDelete}
        onSave={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Excluir página" }),
    );

    expect(
      screen.getByRole("alertdialog", {
        name: "Confirmar exclusão da página",
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Excluir a página "Dor lombar"? Essa ação não pode ser desfeita.',
      ),
    ).toBeTruthy();
    expect(onDelete).not.toHaveBeenCalled();
  });

  test("confirms and deletes the selected page", async () => {
    const onDelete = vi.fn(() => Promise.resolve());

    render(
      <PageEditor
        {...movementProps}
        page={page}
        onDelete={onDelete}
        onSave={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Excluir página" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar exclusão" }),
    );

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("p1"));
  });

  test("cancels deletion when confirmation is declined", async () => {
    const onDelete = vi.fn(() => Promise.resolve());

    render(
      <PageEditor
        {...movementProps}
        page={page}
        onDelete={onDelete}
        onSave={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Excluir página" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("alertdialog", {
          name: "Confirmar exclusão da página",
        }),
      ).toBeNull(),
    );
    expect(onDelete).not.toHaveBeenCalled();
  });

  test("moves the selected page upward", async () => {
    const onMove = vi.fn(() => Promise.resolve());

    render(
      <PageEditor
        canMoveUp
        canMoveDown={false}
        onMove={onMove}
        page={{ ...page, position: 1 }}
        onDelete={vi.fn(() => Promise.resolve())}
        onSave={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Mover página para cima" }),
    );

    await waitFor(() => expect(onMove).toHaveBeenCalledWith("up"));
  });

  test("shows a recovery message when moving a page fails", async () => {
    const onMove = vi.fn(() =>
      Promise.reject(new Error("move failed")),
    );

    render(
      <PageEditor
        canMoveUp
        canMoveDown
        onMove={onMove}
        page={{ ...page, position: 1 }}
        onDelete={vi.fn(() => Promise.resolve())}
        onSave={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Mover página para cima" }),
    );

    expect(
      await screen.findByText(
        "Não foi possível mover a página para cima.",
      ),
    ).toBeTruthy();
  });

  test("shows a recovery message when deletion fails", async () => {
    const onDelete = vi.fn(() =>
      Promise.reject(new Error("delete failed")),
    );

    render(
      <PageEditor
        {...movementProps}
        page={page}
        onDelete={onDelete}
        onSave={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Excluir página" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar exclusão" }),
    );

    expect(
      await screen.findByText("Não foi possível excluir a página."),
    ).toBeTruthy();
  });
});
