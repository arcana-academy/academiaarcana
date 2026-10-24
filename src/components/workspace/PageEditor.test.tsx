// @vitest-environment jsdom

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
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
  afterEach(() => vi.restoreAllMocks());

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

  test("persists an accessible description with a block on confirmed save", async () => {
    const onSave = vi.fn((input: SaveInput) =>
      Promise.resolve({ ...page, title: input.title, content: input.content }),
    );
    render(
      <PageEditor
        {...movementProps}
        page={page}
        onDelete={vi.fn(() => Promise.resolve())}
        onSave={onSave}
      />,
    );
    fireEvent.change(screen.getByLabelText("Tipo do bloco 1"), {
      target: { value: "image" },
    });
    fireEvent.change(screen.getByLabelText("Descrição alternativa"), {
      target: { value: "Ciclo da água representado em três etapas." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].content.blocks[0]).toEqual({
      type: "image",
      content: "Conteúdo inicial.",
      accessibility: {
        description: "Ciclo da água representado em três etapas.",
        decorative: false,
      },
    });
    expect(await screen.findByText("Página salva.")).toBeTruthy();
  });

  test("clears obsolete alt text when an image is marked decorative", async () => {
    const onSave = vi.fn((input: SaveInput) =>
      Promise.resolve({ ...page, title: input.title, content: input.content }),
    );
    render(
      <PageEditor
        {...movementProps}
        page={page}
        onDelete={vi.fn(() => Promise.resolve())}
        onSave={onSave}
      />,
    );
    fireEvent.change(screen.getByLabelText("Tipo do bloco 1"), {
      target: { value: "image" },
    });
    fireEvent.change(screen.getByLabelText("Descrição alternativa"), {
      target: { value: "Descrição anterior." },
    });
    fireEvent.click(screen.getByLabelText("Imagem decorativa (sem informação essencial)"));
    expect(screen.queryByLabelText("Descrição alternativa")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].content.blocks[0].accessibility).toEqual({
      description: "",
      decorative: true,
    });
  });

  test("invalidates confirmed save after changing the title or inserting a block", async () => {
    const onSave = vi.fn((input: SaveInput) =>
      Promise.resolve({ ...page, title: input.title, content: input.content }),
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
    expect(await screen.findByText("Página salva.")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Atualizado após salvar" },
    });
    expect(screen.queryByText("Página salva.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    expect(await screen.findByText("Página salva.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Adicionar bloco" }));
    expect(screen.queryByText("Página salva.")).toBeNull();
  });

  test("does not retain decorative-image metadata when changing block type", async () => {
    const onSave = vi.fn((input: SaveInput) =>
      Promise.resolve({ ...page, title: input.title, content: input.content }),
    );
    render(
      <PageEditor
        {...movementProps}
        page={page}
        onDelete={vi.fn(() => Promise.resolve())}
        onSave={onSave}
      />,
    );
    fireEvent.change(screen.getByLabelText("Tipo do bloco 1"), {
      target: { value: "image" },
    });
    fireEvent.click(screen.getByLabelText("Imagem decorativa (sem informação essencial)"));
    fireEvent.change(screen.getByLabelText("Tipo do bloco 1"), {
      target: { value: "paragraph" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].content.blocks[0].accessibility).toBeUndefined();
  });

  test("renders the styled and accessible block container", () => {
    const { container } = render(
      <PageEditor
        {...movementProps}
        page={page}
        onDelete={vi.fn(() => Promise.resolve())}
        onSave={vi.fn()}
      />,
    );
    const styled = container.querySelector(".workspace-page-block");
    expect(styled).not.toBeNull();
    expect(styled?.querySelector("textarea")).toBeTruthy();
    expect(styled?.querySelector("details")).toBeTruthy();
  });

  test("applies an experiment starter only to an empty page, pending manual save", async () => {
    const emptyPage: Page = { ...page, id: "blank-new", content: { type: "document", blocks: [] } };
    const onSave = vi.fn(async (input: SaveInput) => ({ ...emptyPage, ...input }));
    render(<PageEditor {...movementProps} page={emptyPage}
      onDelete={vi.fn(async () => undefined)} onSave={onSave} />);
    const selector = screen.getByRole("combobox", { name: "Modelo inicial" });
    expect(screen.getAllByRole("option")).toHaveLength(4);
    fireEvent.change(selector, { target: { value: "experiment" } });
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Aplicar modelo" }));
    expect(screen.getByLabelText("Bloco 1")).toHaveProperty("value", "Objetivo do experimento:");
    expect(screen.getByLabelText("Bloco 6")).toHaveProperty("value", "Conclusão:");
    expect(screen.getByRole("button", { name: "Aplicar modelo" })).toBeDisabled();
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].content.blocks).toHaveLength(6);
  });

  test("does not replace existing study notes", () => {
    const onSave = vi.fn();
    render(<PageEditor {...movementProps} page={page}
      onDelete={vi.fn(async () => undefined)} onSave={onSave} />);
    expect(screen.getByRole("button", { name: "Aplicar modelo" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Modelo inicial" })).toBeDisabled();
    expect(screen.getByLabelText("Bloco 1")).toHaveProperty("value", "Conteúdo inicial.");
    expect(onSave).not.toHaveBeenCalled();
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

  test("announces pending save without claiming completion", async () => {
    const pendingSave = vi.fn(() => new Promise<Page>(() => undefined));
    render(
      <PageEditor
        {...movementProps}
        page={page}
        onDelete={vi.fn(async () => undefined)}
        onSave={pendingSave}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    expect(screen.getByText("Salvando página…").closest("[role=status]")).not.toBeNull();
    expect(screen.getByText("Salvando página…")).toBeInTheDocument();
    expect(screen.queryByText("Página salva.")).toBeNull();
    expect(pendingSave).toHaveBeenCalledOnce();
  });

  test("clears stale saved feedback when a confirmed page is edited again", async () => {
    const onSave = vi.fn((input: SaveInput) => Promise.resolve({
      ...page, title: input.title, content: input.content,
    }));
    render(
      <PageEditor
        {...movementProps}
        page={page}
        onDelete={vi.fn(async () => undefined)}
        onSave={onSave}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    expect(await screen.findByText("Página salva.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Novo título" } });
    expect(screen.queryByText("Página salva.")).toBeNull();
    expect(screen.getByLabelText("Título")).toHaveValue("Novo título");
  });

  test("retains newer local text when an older save completes", async () => {
    let resolveSave!: (saved: Page) => void;
    const onSave = vi.fn(() => new Promise<Page>((resolve) => {
      resolveSave = resolve;
    }));
    render(
      <PageEditor
        {...movementProps}
        page={page}
        onDelete={vi.fn(async () => undefined)}
        onSave={onSave}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    expect(screen.getByText("Salvando página…")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Ideia nova ainda não salva" },
    });
    await act(async () => {
      resolveSave({ ...page, title: "Dor lombar" });
    });
    expect(screen.getByLabelText("Título")).toHaveValue("Ideia nova ainda não salva");
    expect(screen.queryByText("Página salva.")).toBeNull();
    expect(screen.getByRole("button", { name: "Salvar página" })).toBeEnabled();
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

  test("focuses the safe action in the alert dialog and restores focus on Escape", () => {
    const onDelete = vi.fn(async () => undefined);
    render(
      <PageEditor
        {...movementProps}
        page={page}
        onDelete={onDelete}
        onSave={vi.fn()}
      />,
    );
    const launch = screen.getByRole("button", { name: "Excluir página" });
    launch.focus();
    fireEvent.click(launch);
    const confirmation = screen.getByRole("alertdialog", {
      name: "Confirmar exclusão da página",
    });
    expect(confirmation).toHaveAccessibleDescription(
      'Excluir a página "Dor lombar"? Essa ação não pode ser desfeita.',
    );
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();
    fireEvent.keyDown(confirmation, { key: "Escape" });
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Excluir página" })).toHaveFocus();
    expect(onDelete).not.toHaveBeenCalled();
  });

  test("closes the dialog on Escape even after focus moves outside", () => {
    const onDelete = vi.fn(async () => undefined);
    render(
      <PageEditor
        {...movementProps}
        page={page}
        onDelete={onDelete}
        onSave={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Excluir página" }));
    screen.getByLabelText("Título").focus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Excluir página" })).toHaveFocus();
    expect(onDelete).not.toHaveBeenCalled();
  });

  test("keeps Tab focus inside the destructive confirmation", () => {
    render(
      <PageEditor
        {...movementProps}
        page={page}
        onDelete={vi.fn(async () => undefined)}
        onSave={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Excluir página" }));
    const cancel = screen.getByRole("button", { name: "Cancelar" });
    const confirm = screen.getByRole("button", { name: "Confirmar exclusão" });
    expect(cancel).toHaveFocus();
    expect(screen.getByRole("alertdialog")).toHaveAttribute("aria-modal", "true");

    confirm.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(cancel).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(confirm).toHaveFocus();
    fireEvent.click(cancel);
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

  test("blocks practice and mission navigation while changes are unsaved, then restores it after save", async () => {
    const onSave = vi.fn(async (input: SaveInput): Promise<Page> => ({
      ...page,
      title: input.title,
      content: input.content,
    }));

    render(
      <PageEditor
        {...movementProps}
        page={page}
        onDelete={vi.fn(async () => undefined)}
        onSave={onSave}
      />,
    );

    expect(screen.getByRole("link", { name: "Praticar este conteúdo" })).toHaveAttribute(
      "href",
      "/pratica?pagina=p1",
    );
    expect(screen.getByRole("link", { name: "Planejar uma tarefa de estudo" })).toHaveAttribute(
      "href",
      "/cronograma",
    );
    expect(screen.getByRole("link", { name: "Ver minhas missões" })).toHaveAttribute("href", "/missoes");
    expect(screen.getByText(/não de abrir a página/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Revisão prática" },
    });
    expect(screen.queryByRole("link", { name: "Praticar este conteúdo" })).toBeNull();
    expect(screen.getByText(/Salve as alterações desta página/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    expect(await screen.findByText("Página salva.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Praticar este conteúdo" })).toBeTruthy();
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: "Revisão prática" }));

    fireEvent.change(screen.getByLabelText("Bloco 1"), {
      target: { value: "Segunda edição ainda não salva" },
    });

    expect(screen.queryByText("Página salva.")).toBeNull();
    expect(screen.queryByRole("link", { name: "Ver minhas missões" })).toBeNull();
    expect(screen.getByText(/Salve as alterações desta página/)).toBeTruthy();
  });

  test("keeps the learning exits unavailable when a save fails", async () => {
    const onSave = vi.fn(async () => {
      throw new Error("isolated failure");
    });
    render(
      <PageEditor
        {...movementProps}
        page={page}
        onDelete={vi.fn(async () => undefined)}
        onSave={onSave}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Adicionar bloco" }));
    expect(screen.queryByRole("link", { name: "Praticar este conteúdo" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    expect(await screen.findByText("Não foi possível salvar a página.")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Praticar este conteúdo" })).toBeNull();
    expect(screen.getByText(/Salve as alterações desta página/)).toBeTruthy();
  });

  test("encodes persisted page ids used by the practice destination", () => {
    render(
      <PageEditor
        {...movementProps}
        page={{ ...page, id: "id/?#%" }}
        onDelete={vi.fn(async () => undefined)}
        onSave={vi.fn(async () => page)}
      />,
    );
    expect(screen.getByRole("link", { name: "Praticar este conteúdo" })).toHaveAttribute(
      "href",
      "/pratica?pagina=id%2F%3F%23%25",
    );
  });

  test("opens guided reading only from saved text and returns to the editor", async () => {
    const onSave = vi.fn(async (input: SaveInput): Promise<Page> => ({
      ...page,
      title: input.title,
      content: input.content,
    }));
    render(
      <PageEditor
        {...movementProps}
        page={page}
        onDelete={vi.fn(async () => undefined)}
        onSave={onSave}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Iniciar leitura guiada" }));
    expect(screen.getByRole("heading", { name: "Modo de leitura guiada" })).toBeInTheDocument();
    expect(screen.getByText("Conteúdo inicial.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Salvar página" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao editor" }));

    fireEvent.change(screen.getByLabelText("Bloco 1"), {
      target: { value: "Texto novo agora salvo." },
    });
    expect(screen.getByRole("button", { name: "Iniciar leitura guiada" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    expect(await screen.findByText("Página salva.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Iniciar leitura guiada" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Iniciar leitura guiada" }));
    expect(screen.getByText("Texto novo agora salvo.")).toBeInTheDocument();
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  test("disables guided reading for an empty or whitespace-only page", () => {
    render(
      <PageEditor
        {...movementProps}
        page={{ ...page, content: { type: "document", blocks: [
          { type: "paragraph", content: "   " },
        ] } }}
        onDelete={vi.fn(async () => undefined)}
        onSave={vi.fn(async () => page)}
      />,
    );
    expect(screen.getByRole("button", { name: "Iniciar leitura guiada" })).toBeDisabled();
    expect(screen.getByText(/Adicione conteúdo a esta página e salve/)).toBeInTheDocument();
  });

});

describe("saved block checklist integration", () => {
  test("only opens for saved text and returns without persisting markings", async () => {
    const onSave = vi.fn(async (input: SaveInput): Promise<Page> => ({ ...page, content: input.content, title: input.title }));
    render(<PageEditor {...movementProps} page={page} onDelete={vi.fn(async () => undefined)} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Organizar estudo por trechos" }));
    expect(screen.getByRole("heading", { name: "Lista de estudo por trechos" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Trecho 1" }));
    expect(screen.getByText("1 de 1 trechos marcados nesta tela.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao editor" }));
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Organizar estudo por trechos" }));
    expect(screen.getByText("0 de 1 trechos marcados nesta tela.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao editor" }));
    fireEvent.change(screen.getByLabelText("Bloco 1"), { target: { value: "Texto não salvo." } });
    expect(screen.getByRole("button", { name: "Organizar estudo por trechos" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    expect(await screen.findByText("Página salva.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Organizar estudo por trechos" })).toBeEnabled();
  });
});

describe("temporary glossary integration", () => {
  test("requires saved nonempty content and discards entries upon return", async () => {
    const onSave = vi.fn(async (input: SaveInput): Promise<Page> => ({ ...page, title: input.title, content: input.content }));
    render(<PageEditor {...movementProps} page={page} onDelete={vi.fn(async () => undefined)} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Criar glossário temporário" }));
    expect(screen.getByRole("heading", { name: "Glossário pessoal temporário" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Termo"), { target: { value: "Átomo" } });
    fireEvent.change(screen.getByLabelText("Definição com suas palavras"), { target: { value: "Unidade química" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar conceito" }));
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao editor" }));
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Criar glossário temporário" }));
    expect(screen.getByText("0 conceito(s) nesta tela.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao editor" }));
    fireEvent.change(screen.getByLabelText("Bloco 1"), { target: { value: "Não salvo" } });
    expect(screen.getByRole("button", { name: "Criar glossário temporário" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    expect(await screen.findByText("Página salva.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar glossário temporário" })).toBeEnabled();
  });
});


describe("progress actions while the editor has unsaved content", () => {
  test("prevents completion before saving and restores the action after a successful save", async () => {
    const onSetProgress = vi.fn(async () => undefined);
    const onSave = vi.fn(async (input: SaveInput): Promise<Page> => ({
      ...page,
      title: input.title,
      content: input.content,
    }));

    render(
      <PageEditor
        {...movementProps}
        page={page}
        onDelete={vi.fn(async () => undefined)}
        onSave={onSave}
        onSetProgress={onSetProgress}
      />,
    );

    expect(screen.getByRole("button", { name: "Concluir página" })).toBeEnabled();

    fireEvent.change(screen.getByLabelText("Bloco 1"), {
      target: { value: "Alteração ainda não salva" },
    });

    expect(screen.getByRole("button", { name: "Concluir página" })).toBeDisabled();
    expect(screen.getByText("Salve a página antes de atualizar o progresso de estudo.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Concluir página" }));
    expect(onSetProgress).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    expect(await screen.findByText("Página salva.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Concluir página" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Concluir página" }));
    await waitFor(() => expect(onSetProgress).toHaveBeenCalledExactlyOnceWith("completed"));
  });

  test("keeps progress unavailable after a failed save, including for an already completed page", async () => {
    const onSetProgress = vi.fn(async () => undefined);
    render(
      <PageEditor
        {...movementProps}
        page={page}
        progressStatus="completed"
        onDelete={vi.fn(async () => undefined)}
        onSave={vi.fn(async () => { throw new Error("synthetic save failure"); })}
        onSetProgress={onSetProgress}
      />,
    );

    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Rascunho não salvo" },
    });
    expect(screen.getByRole("button", { name: "Marcar como em andamento" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    expect(await screen.findByText("Não foi possível salvar a página.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Marcar como em andamento" })).toBeDisabled();
    expect(onSetProgress).not.toHaveBeenCalled();
  });
});
