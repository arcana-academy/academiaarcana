// @vitest-environment jsdom

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Chapter, Grimoire, Notebook, Page } from "@/domains/learning";
import { WorkspaceShell, resetVolatileWorkspaceDraftsForTests } from "./WorkspaceShell";

const createdGrimoire: Grimoire = {
  id: "g2",
  ownerId: "u1",
  title: "Novo grimório",
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-20T00:00:00.000Z",
};

const renamedNotebook: Notebook = {
  id: "n1",
  grimoireId: "g1",
  title: "Caderno renomeado",
  position: 0,
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-20T01:00:00.000Z",
};

const createdNotebook: Notebook = {
  id: "n2",
  grimoireId: "g1",
  title: "Novo caderno",
  position: 1,
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-20T00:00:00.000Z",
};

const createdChapter: Chapter = {
  id: "c1",
  notebookId: "n1",
  title: "Novo capítulo",
  position: 0,
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-20T00:00:00.000Z",
};

const createdPage: Page = {
  id: "p1",
  chapterId: "c1",
  title: "Nova página",
  content: {
    type: "document",
    blocks: [],
  },
  position: 0,
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-20T00:00:00.000Z",
};

/** Build the smallest hierarchy needed to exercise page creation. */
function createTree(): Parameters<typeof WorkspaceShell>[0]["tree"] {
  return {
    grimoires: [
      {
        id: "g1",
        ownerId: "u1",
        title: "Grimório",
        createdAt: "2026-09-20T00:00:00.000Z",
        updatedAt: "2026-09-20T00:00:00.000Z",
        notebooks: [
          {
            id: "n1",
            grimoireId: "g1",
            title: "Caderno",
            position: 0,
            createdAt: "2026-09-20T00:00:00.000Z",
            updatedAt: "2026-09-20T00:00:00.000Z",
            chapters: [
              {
                id: "c1",
                notebookId: "n1",
                title: "Capítulo",
                position: 0,
                createdAt: "2026-09-20T00:00:00.000Z",
                updatedAt: "2026-09-20T00:00:00.000Z",
                pages: [],
              },
            ],
          },
        ],
      },
    ],
  };
}

describe("WorkspaceShell", () => {
  test("consumes a matching saved snapshot before a subsequent remote remount", async () => {
    const tree = createTree();
    const persisted = { ...createdPage, id: "p-consumed-ack", title: "Antes" };
    tree.grimoires[0]!.ownerId = "owner-consumed-ack";
    tree.grimoires[0]!.notebooks![0]!.chapters![0]!.pages = [persisted];
    const props = shellProps(tree, {
      grimoireId: "g1", notebookId: "n1", chapterId: "c1", pageId: persisted.id,
    });
    const first = render(<WorkspaceShell {...props}
      onSavePage={vi.fn(async (input: { id: string; title: string; content: Page["content"] }) => ({ ...persisted, ...input }))} />);
    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Salvamento confirmado" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    expect(await screen.findByText("Página salva.")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText("Título")).toHaveValue("Salvamento confirmado");
    });
    first.unmount();

    const freshTree = createTree();
    freshTree.grimoires[0]!.ownerId = "owner-consumed-ack";
    freshTree.grimoires[0]!.notebooks![0]!.chapters![0]!.pages = [{
      ...persisted, title: "Versão remota posterior",
    }];
    render(<WorkspaceShell {...shellProps(freshTree, {
      grimoireId: "g1", notebookId: "n1", chapterId: "c1", pageId: persisted.id,
    })} />);
    expect(screen.getByLabelText("Título")).toHaveValue("Versão remota posterior");
    expect(screen.queryByText("Revisar versões da página")).not.toBeInTheDocument();
  });

  test("isolates a new scenario from the previous volatile draft on explicit reset", () => {
    const firstTree = createTree();
    const pageOne = { ...createdPage, id: "p-same-across-scenarios", title: "Antes" };
    firstTree.grimoires[0]!.ownerId = "owner-reused-id";
    firstTree.grimoires[0]!.notebooks![0]!.chapters![0]!.pages = [pageOne];
    const currentSelection = {
      grimoireId: "g1", notebookId: "n1", chapterId: "c1", pageId: pageOne.id,
    };
    const first = render(<WorkspaceShell {...shellProps(firstTree, currentSelection)} />);
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Rascunho antigo" } });
    first.unmount();

    resetVolatileWorkspaceDraftsForTests();
    const secondTree = createTree();
    secondTree.grimoires[0]!.ownerId = "owner-reused-id";
    secondTree.grimoires[0]!.notebooks![0]!.chapters![0]!.pages = [{
      ...pageOne, title: "Versão limpa",
    }];
    render(<WorkspaceShell {...shellProps(secondTree, currentSelection)} />);
    expect(screen.getByLabelText("Título")).toHaveValue("Versão limpa");
  });


  test("does not forge history entries or claim cancellation of Back/Forward", () => {
    const tree = createTree();
    const currentPage = { ...createdPage, id: "p-history-case", title: "Histórico protegido" };
    tree.grimoires[0]!.ownerId = "owner-history-case";
    tree.grimoires[0]!.notebooks![0]!.chapters![0]!.pages = [currentPage];
    window.history.replaceState({}, "", "/workspace?view=tree&page=p-history-case#current");
    render(<WorkspaceShell {...shellProps(tree, {
      grimoireId: "g1", notebookId: "n1", chapterId: "c1", pageId: "p-history-case",
    })} />);
    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Rascunho ainda não salvo" },
    });
    const pushState = vi.spyOn(window.history, "pushState");
    const confirm = vi.spyOn(window, "confirm");
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(pushState).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
    // A synthetic popstate does not establish safe real-browser history traversal.
    expect(screen.getByLabelText("Título")).toHaveValue("Rascunho ainda não salvo");
    pushState.mockRestore();
    confirm.mockRestore();
  });

  test("remounts a pending save as unconfirmed until its original server response arrives", async () => {
    const tree = createTree();
    const currentPage = { ...createdPage, id: "p-pending-remount", title: "Remount pendente" };
    tree.grimoires[0]!.ownerId = "owner-pending-remount";
    tree.grimoires[0]!.notebooks![0]!.chapters![0]!.pages = [currentPage];
    window.history.replaceState({}, "", "/workspace?view=tree&page=p-pending-remount#current");
    let resolveSave!: (saved: Page) => void;
    const onSavePage = vi.fn(() => new Promise<Page>((resolve) => { resolveSave = resolve; }));
    const props = {
      ...shellProps(tree, { grimoireId: "g1", notebookId: "n1", chapterId: "c1", pageId: "p-pending-remount" }),
      onSavePage,
    };
    const first = render(<WorkspaceShell {...props} />);
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Pendente confirmado depois" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    expect(screen.queryByText("Página salva.")).not.toBeInTheDocument();
    first.unmount();
    render(<WorkspaceShell {...props} />);
    expect(screen.getByText("Salvamento sem confirmação. Seu rascunho continua nesta aba."))
      .toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toHaveValue("Pendente confirmado depois");
    await act(async () => {
      resolveSave({ ...currentPage, title: "Pendente confirmado depois" });
    });
    expect(await screen.findByText("Página salva.")).toBeInTheDocument();
    expect(onSavePage).toHaveBeenCalledTimes(1);
  });

  test("retains the draft and reports a real save failure after remount", async () => {
    const tree = createTree();
    const currentPage = { ...createdPage, id: "p-failed-remount", title: "Página pendente" };
    tree.grimoires[0]!.ownerId = "owner-failed-remount";
    tree.grimoires[0]!.notebooks![0]!.chapters![0]!.pages = [currentPage];
    window.history.replaceState({}, "", "/workspace?view=tree&page=p-failed-remount#current");
    let rejectSave!: (reason: Error) => void;
    const onSavePage = vi.fn(() => new Promise<Page>((_resolve, reject) => { rejectSave = reject; }));
    const props = {
      ...shellProps(tree, { grimoireId: "g1", notebookId: "n1", chapterId: "c1", pageId: "p-failed-remount" }),
      onSavePage,
    };
    const first = render(<WorkspaceShell {...props} />);
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Nunca perder este texto" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    first.unmount();
    render(<WorkspaceShell {...props} />);
    await act(async () => { rejectSave(new Error("Servidor indisponível")); });
    expect(await screen.findByText("Não foi possível salvar a página.")).toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toHaveValue("Nunca perder este texto");
    expect(screen.getByRole("button", { name: "Salvar página" })).toBeEnabled();
    expect(screen.queryByText("Página salva.")).not.toBeInTheDocument();
  });

  test("keeps edits made after remount when an older server acknowledgement arrives", async () => {
    const tree = createTree();
    const currentPage = { ...createdPage, id: "p-later-edit", title: "Original" };
    tree.grimoires[0]!.ownerId = "owner-later-edit";
    tree.grimoires[0]!.notebooks![0]!.chapters![0]!.pages = [currentPage];
    window.history.replaceState({}, "", "/workspace?view=tree&page=p-later-edit#current");
    let resolveSave!: (saved: Page) => void;
    const onSavePage = vi.fn(() => new Promise<Page>((resolve) => { resolveSave = resolve; }));
    const props = {
      ...shellProps(tree, { grimoireId: "g1", notebookId: "n1", chapterId: "c1", pageId: "p-later-edit" }),
      onSavePage,
    };
    const first = render(<WorkspaceShell {...props} />);
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Primeira edição" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
    first.unmount();
    render(<WorkspaceShell {...props} />);
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Edição posterior" } });
    await act(async () => { resolveSave({ ...currentPage, title: "Primeira edição" }); });
    expect(screen.getByLabelText("Título")).toHaveValue("Edição posterior");
    expect(screen.queryByText("Página salva.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar página" })).toBeEnabled();
    expect(onSavePage).toHaveBeenCalledTimes(1);
  });

  test("does not discard a dirty page when the learner cancels selection", async () => {
    const tree = createTree();
    const draftPage = { ...createdPage, id: "draft-protect-case", title: "Página protegida" };
    tree.grimoires[0]!.ownerId = "owner-protect-case";
    tree.grimoires[0]!.notebooks![0]!.chapters![0]!.pages = [draftPage];
    window.history.replaceState({}, "", "/workspace?view=tree&page=draft-protect-case#current");
    const props = shellProps(tree, {
      grimoireId: "g1", notebookId: "n1", chapterId: "c1", pageId: "draft-protect-case",
    });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<WorkspaceShell {...props} />);
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Texto não salvo" } });
    fireEvent.click(screen.getByRole("button", { name: "Caderno" }));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(screen.getByDisplayValue("Texto não salvo")).toBeInTheDocument();
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Caderno" }));
    expect(screen.queryByDisplayValue("Texto não salvo")).not.toBeInTheDocument();
    confirm.mockRestore();
  });

  test("restores an owner-scoped volatile draft after an authorized remount", async () => {
    const tree = createTree();
    const draftPage = { ...createdPage, id: "draft-remount-case", title: "Página temporária" };
    tree.grimoires[0]!.ownerId = "owner-remount-case";
    tree.grimoires[0]!.notebooks![0]!.chapters![0]!.pages = [draftPage];
    window.history.replaceState({}, "", "/workspace?view=tree&page=draft-remount-case#current");
    const props = shellProps(tree, {
      grimoireId: "g1", notebookId: "n1", chapterId: "c1", pageId: "draft-remount-case",
    });
    const first = render(<WorkspaceShell {...props} />);
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Preservar esta edição" } });
    first.unmount();
    render(<WorkspaceShell {...props} />);
    expect(await screen.findByDisplayValue("Preservar esta edição")).toBeInTheDocument();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Caderno" }));
    confirm.mockRestore();
  });

  beforeEach(() => {
    resetVolatileWorkspaceDraftsForTests();
    window.history.replaceState({}, "", "/workspace?view=tree#current");
  });

  test("creates a grimoire and selects it", async () => {
    const onCreateGrimoire = vi.fn(() => Promise.resolve(createdGrimoire));
    const onCreateNotebook = vi.fn(() => Promise.resolve(createdNotebook));
    const onCreateChapter = vi.fn(() => Promise.resolve(createdChapter));
    const onCreatePage = vi.fn(() => Promise.resolve(createdPage));
    const onDeletePage = vi.fn(() => Promise.resolve());
    const onSavePage = vi.fn(() => Promise.resolve(createdPage));

    render(
      <WorkspaceShell
        tree={{ grimoires: [] }}
        initialState={{
          grimoireId: null,
          notebookId: null,
          chapterId: null,
          pageId: null,
        }}
        onCreateGrimoire={onCreateGrimoire}
        onRenameGrimoire={vi.fn(() => Promise.resolve(createdGrimoire))}
        onRenameNotebook={vi.fn(() => Promise.resolve(renamedNotebook))}
        onRenameChapter={vi.fn(() => Promise.resolve(createdChapter))}
        onCreateNotebook={onCreateNotebook}
        onCreateChapter={onCreateChapter}
        onCreatePage={onCreatePage}
        onMovePage={vi.fn(() =>
          Promise.resolve({
            movedPage: createdPage,
            swappedPage: null,
          }),
        )}
        onDeletePage={onDeletePage}
        onSavePage={onSavePage}
      />,
    );

    fireEvent.change(screen.getByLabelText("Novo grimório"), {
      target: { value: "Novo grimório" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar grimório" }));

    expect(await screen.findByLabelText("Novo caderno")).toBeTruthy();
    expect(onCreateGrimoire).toHaveBeenCalledWith({
      title: "Novo grimório",
    });
    expect(
      screen.getByRole("button", { name: "Novo grimório" }),
    ).toHaveAttribute("aria-current", "true");
    await waitFor(() =>
      expect(window.location.search).toBe("?view=tree&grimoire=g2"),
    );
  });

  test("creates a notebook and selects it", async () => {
    const onCreateGrimoire = vi.fn(() => Promise.resolve(createdGrimoire));
    const onCreateNotebook = vi.fn(() => Promise.resolve(createdNotebook));
    const onCreateChapter = vi.fn(() => Promise.resolve(createdChapter));
    const onCreatePage = vi.fn(() => Promise.resolve(createdPage));
    const onDeletePage = vi.fn(() => Promise.resolve());
    const onSavePage = vi.fn(() => Promise.resolve(createdPage));

    const tree = createTree();
    tree.grimoires[0].notebooks = [];

    render(
      <WorkspaceShell
        tree={tree}
        initialState={{
          grimoireId: "g1",
          notebookId: null,
          chapterId: null,
          pageId: null,
        }}
        onCreateGrimoire={onCreateGrimoire}
        onRenameGrimoire={vi.fn(() => Promise.resolve(createdGrimoire))}
        onRenameNotebook={vi.fn(() => Promise.resolve(renamedNotebook))}
        onRenameChapter={vi.fn(() => Promise.resolve(createdChapter))}
        onCreateNotebook={onCreateNotebook}
        onCreateChapter={onCreateChapter}
        onCreatePage={onCreatePage}
        onMovePage={vi.fn(() =>
          Promise.resolve({
            movedPage: createdPage,
            swappedPage: null,
          }),
        )}
        onDeletePage={onDeletePage}
        onSavePage={onSavePage}
      />,
    );

    fireEvent.change(screen.getByLabelText("Novo caderno"), {
      target: { value: "Novo caderno" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar caderno" }));

    expect(await screen.findByLabelText("Novo capítulo")).toBeTruthy();
    expect(onCreateNotebook).toHaveBeenCalledWith({
      grimoireId: "g1",
      title: "Novo caderno",
    });
    expect(
      screen.getByRole("button", { name: "Novo caderno" }),
    ).toHaveAttribute("aria-current", "true");
    await waitFor(() =>
      expect(window.location.search).toBe("?view=tree&notebook=n2"),
    );
  });

  test("renames the selected notebook and updates its title", async () => {
    const onRenameNotebook = vi.fn(() => Promise.resolve(renamedNotebook));

    render(
      <WorkspaceShell
        tree={createTree()}
        initialState={{
          grimoireId: "g1",
          notebookId: "n1",
          chapterId: null,
          pageId: null,
        }}
        onCreateGrimoire={vi.fn(() => Promise.resolve(createdGrimoire))}
        onRenameGrimoire={vi.fn(() => Promise.resolve(createdGrimoire))}
        onRenameNotebook={onRenameNotebook}
        onRenameChapter={vi.fn(() => Promise.resolve(createdChapter))}
        onCreateNotebook={vi.fn(() => Promise.resolve(createdNotebook))}
        onCreateChapter={vi.fn(() => Promise.resolve(createdChapter))}
        onCreatePage={vi.fn(() => Promise.resolve(createdPage))}
        onMovePage={vi.fn(() =>
          Promise.resolve({
            movedPage: createdPage,
            swappedPage: null,
          }),
        )}
        onDeletePage={vi.fn(() => Promise.resolve())}
        onSavePage={vi.fn(() => Promise.resolve(createdPage))}
      />,
    );

    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Caderno renomeado" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar título" }));

    expect(onRenameNotebook).toHaveBeenCalledWith({
      id: "n1",
      title: "Caderno renomeado",
    });
    expect(await screen.findByRole("heading", { name: "Caderno renomeado" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Caderno renomeado" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  test("creates a chapter and selects it", async () => {
    const onCreateGrimoire = vi.fn(() => Promise.resolve(createdGrimoire));
    const onCreateChapter = vi.fn(() => Promise.resolve(createdChapter));
    const onCreatePage = vi.fn(() => Promise.resolve(createdPage));
    const onDeletePage = vi.fn(() => Promise.resolve());
    const onSavePage = vi.fn(() => Promise.resolve(createdPage));

    const tree = createTree();
    tree.grimoires[0]!.notebooks![0]!.chapters = [];

    render(
      <WorkspaceShell
        tree={tree}
        initialState={{
          grimoireId: "g1",
          notebookId: "n1",
          chapterId: null,
          pageId: null,
        }}
        onCreateGrimoire={onCreateGrimoire}
        onRenameGrimoire={vi.fn(() => Promise.resolve(createdGrimoire))}
        onRenameNotebook={vi.fn(() => Promise.resolve(renamedNotebook))}
        onRenameChapter={vi.fn(() => Promise.resolve(createdChapter))}
        onCreateNotebook={vi.fn(() => Promise.resolve(createdNotebook))}
        onCreateChapter={onCreateChapter}
        onCreatePage={onCreatePage}
        onMovePage={vi.fn(() =>
          Promise.resolve({
            movedPage: createdPage,
            swappedPage: null,
          }),
        )}
        onDeletePage={onDeletePage}
        onSavePage={onSavePage}
      />,
    );

    fireEvent.change(screen.getByLabelText("Novo capítulo"), {
      target: { value: "Novo capítulo" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar capítulo" }));

    expect(await screen.findByLabelText("Nova página")).toBeTruthy();
    expect(onCreateChapter).toHaveBeenCalledWith({
      notebookId: "n1",
      title: "Novo capítulo",
    });
    expect(screen.getByRole("button", { name: "Novo capítulo" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await waitFor(() =>
      expect(window.location.search).toBe("?view=tree&chapter=c1"),
    );
  });

  test("creates a page and opens it in the editor", async () => {
    const onCreateGrimoire = vi.fn(() => Promise.resolve(createdGrimoire));
    const onCreatePage = vi.fn(() => Promise.resolve(createdPage));
    const onDeletePage = vi.fn(() => Promise.resolve());
    const onSavePage = vi.fn(() => Promise.resolve(createdPage));

    render(
      <WorkspaceShell
        tree={createTree()}
        initialState={{
          grimoireId: "g1",
          notebookId: "n1",
          chapterId: "c1",
          pageId: null,
        }}
        onCreateGrimoire={onCreateGrimoire}
        onRenameGrimoire={vi.fn(() => Promise.resolve(createdGrimoire))}
        onRenameNotebook={vi.fn(() => Promise.resolve(renamedNotebook))}
        onRenameChapter={vi.fn(() => Promise.resolve(createdChapter))}
        onCreateNotebook={vi.fn(() => Promise.resolve(createdNotebook))}
        onCreateChapter={vi.fn(() => Promise.resolve(createdChapter))}
        onCreatePage={onCreatePage}
        onMovePage={vi.fn(() =>
          Promise.resolve({
            movedPage: createdPage,
            swappedPage: null,
          }),
        )}
        onDeletePage={onDeletePage}
        onSavePage={onSavePage}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nova página"), {
      target: { value: "Nova página" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Criar página" }),
    );

    expect(await screen.findByDisplayValue("Nova página")).toBeTruthy();
    expect(onCreatePage).toHaveBeenCalledWith({
      chapterId: "c1",
      title: "Nova página",
    });
    expect(screen.getByRole("button", { name: "Nova página" })).toBeTruthy();
  });


  test("preserves a normalized deep-linked page path and chapter movement context", () => {
    const pageOne: Page = {
      ...createdPage,
      id: "p1",
      title: "Primeira página",
      position: 0,
    };
    const pageTwo: Page = {
      ...createdPage,
      id: "p2",
      title: "Segunda página",
      position: 1,
    };
    const tree = createTree();
    tree.grimoires[0]!.notebooks![0]!.chapters![0]!.pages = [
      pageOne,
      pageTwo,
    ];

    render(
      <WorkspaceShell
        tree={tree}
        initialState={{
          grimoireId: "g1",
          notebookId: "n1",
          chapterId: "c1",
          pageId: "p2",
        }}
        onCreateGrimoire={vi.fn(() => Promise.resolve(createdGrimoire))}
        onRenameGrimoire={vi.fn(() => Promise.resolve(createdGrimoire))}
        onRenameNotebook={vi.fn(() => Promise.resolve(renamedNotebook))}
        onRenameChapter={vi.fn(() => Promise.resolve(createdChapter))}
        onCreateNotebook={vi.fn(() => Promise.resolve(createdNotebook))}
        onCreateChapter={vi.fn(() => Promise.resolve(createdChapter))}
        onCreatePage={vi.fn(() => Promise.resolve(createdPage))}
        onMovePage={vi.fn(() =>
          Promise.resolve({
            movedPage: pageTwo,
            swappedPage: pageOne,
          }),
        )}
        onDeletePage={vi.fn(() => Promise.resolve())}
        onSavePage={vi.fn(() => Promise.resolve(pageTwo))}
      />,
    );

    expect(screen.getByDisplayValue("Segunda página")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Grimório" }))
      .toHaveAttribute("data-active-path", "true");
    expect(screen.getByRole("button", { name: "Caderno" }))
      .toHaveAttribute("data-active-path", "true");
    expect(screen.getByRole("button", { name: "Capítulo" }))
      .toHaveAttribute("data-active-path", "true");
    expect(screen.getByRole("button", { name: "Segunda página" }))
      .toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Mover página para cima" }))
      .not.toBeDisabled();
  });

  test("reflects a saved page title and restores its canonical URL after revalidation", async () => {
    const onSavePage = vi.fn(async () => {
      // Reproduce the URL replacement that Next.js may apply while consuming a
      // server-action revalidation response for the current route.
      window.history.replaceState(window.history.state, "", "/workspace");
      return {
        ...createdPage,
        title: "Página renomeada",
      };
    });
    const tree = createTree();
    tree.grimoires[0]!.notebooks![0]!.chapters![0]!.pages = [createdPage];

    render(
      <WorkspaceShell
        tree={tree}
        initialState={{
          grimoireId: "g1",
          notebookId: "n1",
          chapterId: "c1",
          pageId: "p1",
        }}
        onCreateGrimoire={vi.fn(() => Promise.resolve(createdGrimoire))}
        onRenameGrimoire={vi.fn(() => Promise.resolve(createdGrimoire))}
        onRenameNotebook={vi.fn(() => Promise.resolve(renamedNotebook))}
        onRenameChapter={vi.fn(() => Promise.resolve(createdChapter))}
        onCreateNotebook={vi.fn(() => Promise.resolve(createdNotebook))}
        onCreateChapter={vi.fn(() => Promise.resolve(createdChapter))}
        onCreatePage={vi.fn(() => Promise.resolve(createdPage))}
        onMovePage={vi.fn(() =>
          Promise.resolve({
            movedPage: createdPage,
            swappedPage: null,
          }),
        )}
        onDeletePage={vi.fn(() => Promise.resolve())}
        onSavePage={onSavePage}
      />,
    );

    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Página renomeada" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));

    expect(await screen.findByRole("button", { name: "Página renomeada" })).toBeTruthy();
    await waitFor(() =>
      expect(
        window.location.pathname + window.location.search + window.location.hash,
      ).toBe("/workspace?view=tree&page=p1#current"),
    );
  });

  test("canonicalizes a normalized initial selection without creating a new history entry", async () => {
    window.history.replaceState(
      { preserved: true },
      "",
      "/workspace?view=tree&page=stale#current",
    );

    render(
      <WorkspaceShell
        tree={createTree()}
        initialState={{
          grimoireId: "g1",
          notebookId: "n1",
          chapterId: "c1",
          pageId: null,
        }}
        onCreateGrimoire={vi.fn(() => Promise.resolve(createdGrimoire))}
        onRenameGrimoire={vi.fn(() => Promise.resolve(createdGrimoire))}
        onRenameNotebook={vi.fn(() => Promise.resolve(renamedNotebook))}
        onRenameChapter={vi.fn(() => Promise.resolve(createdChapter))}
        onCreateNotebook={vi.fn(() => Promise.resolve(createdNotebook))}
        onCreateChapter={vi.fn(() => Promise.resolve(createdChapter))}
        onCreatePage={vi.fn(() => Promise.resolve(createdPage))}
        onMovePage={vi.fn(() =>
          Promise.resolve({ movedPage: createdPage, swappedPage: null }),
        )}
        onDeletePage={vi.fn(() => Promise.resolve())}
        onSavePage={vi.fn(() => Promise.resolve(createdPage))}
      />,
    );

    await waitFor(() =>
      expect(
        window.location.pathname + window.location.search + window.location.hash,
      ).toBe("/workspace?view=tree&chapter=c1#current"),
    );
    expect(window.history.state).toEqual({ preserved: true });
  });

  test("updates the canonical URL as the user moves between hierarchy levels", async () => {
    const pageOne: Page = {
      ...createdPage,
      id: "p1",
      title: "Primeira página",
      position: 0,
    };
    const pageTwo: Page = {
      ...createdPage,
      id: "p2",
      title: "Segunda página",
      position: 1,
    };
    const tree = createTree();
    tree.grimoires[0]!.notebooks![0]!.chapters![0]!.pages = [
      pageOne,
      pageTwo,
    ];

    render(
      <WorkspaceShell
        tree={tree}
        initialState={{
          grimoireId: "g1",
          notebookId: "n1",
          chapterId: "c1",
          pageId: "p1",
        }}
        onCreateGrimoire={vi.fn(() => Promise.resolve(createdGrimoire))}
        onRenameGrimoire={vi.fn(() => Promise.resolve(createdGrimoire))}
        onRenameNotebook={vi.fn(() => Promise.resolve(renamedNotebook))}
        onRenameChapter={vi.fn(() => Promise.resolve(createdChapter))}
        onCreateNotebook={vi.fn(() => Promise.resolve(createdNotebook))}
        onCreateChapter={vi.fn(() => Promise.resolve(createdChapter))}
        onCreatePage={vi.fn(() => Promise.resolve(createdPage))}
        onMovePage={vi.fn(() =>
          Promise.resolve({ movedPage: pageTwo, swappedPage: pageOne }),
        )}
        onDeletePage={vi.fn(() => Promise.resolve())}
        onSavePage={vi.fn(() => Promise.resolve(pageTwo))}
      />,
    );

    await waitFor(() =>
      expect(window.location.search).toBe("?view=tree&page=p1"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Segunda página" }));
    await waitFor(() =>
      expect(window.location.search).toBe("?view=tree&page=p2"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Capítulo" }));
    await waitFor(() =>
      expect(window.location.search).toBe("?view=tree&chapter=c1"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Caderno" }));
    await waitFor(() =>
      expect(window.location.search).toBe("?view=tree&notebook=n1"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Grimório" }));
    await waitFor(() =>
      expect(window.location.search).toBe("?view=tree&grimoire=g1"),
    );
    expect(window.location.hash).toBe("#current");
  });

  test("updates the URL when a newly created page becomes selected and after it is deleted", async () => {
    const onDeletePage = vi.fn(() => Promise.resolve());

    render(
      <WorkspaceShell
        tree={createTree()}
        initialState={{
          grimoireId: "g1",
          notebookId: "n1",
          chapterId: "c1",
          pageId: null,
        }}
        onCreateGrimoire={vi.fn(() => Promise.resolve(createdGrimoire))}
        onRenameGrimoire={vi.fn(() => Promise.resolve(createdGrimoire))}
        onRenameNotebook={vi.fn(() => Promise.resolve(renamedNotebook))}
        onRenameChapter={vi.fn(() => Promise.resolve(createdChapter))}
        onCreateNotebook={vi.fn(() => Promise.resolve(createdNotebook))}
        onCreateChapter={vi.fn(() => Promise.resolve(createdChapter))}
        onCreatePage={vi.fn(() => Promise.resolve(createdPage))}
        onMovePage={vi.fn(() =>
          Promise.resolve({ movedPage: createdPage, swappedPage: null }),
        )}
        onDeletePage={onDeletePage}
        onSavePage={vi.fn(() => Promise.resolve(createdPage))}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nova página"), {
      target: { value: "Nova página" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar página" }));

    expect(await screen.findByDisplayValue("Nova página")).toBeTruthy();
    await waitFor(() =>
      expect(window.location.search).toBe("?view=tree&page=p1"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Excluir página" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar exclusão" }));

    await waitFor(() => expect(onDeletePage).toHaveBeenCalledWith("p1"));
    await waitFor(() =>
      expect(window.location.search).toBe("?view=tree&chapter=c1"),
    );
    expect(screen.getByRole("region", { name: "Área de trabalho" })).toHaveFocus();
    const deletionStatus = screen.getByText("Página excluída. Retorno ao capítulo.");
    expect(deletionStatus.closest('[role="status"]')).toHaveAttribute("aria-live", "polite");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  // These are proposed regressions. They have not been executed.
  const shellProps = (
    tree: Parameters<typeof WorkspaceShell>[0]["tree"],
    initialState: Parameters<typeof WorkspaceShell>[0]["initialState"],
  ): Parameters<typeof WorkspaceShell>[0] => ({
    tree,
    initialState,
    onCreateGrimoire: vi.fn(async () => createdGrimoire),
    onRenameGrimoire: vi.fn(async () => createdGrimoire),
    onRenameNotebook: vi.fn(async () => renamedNotebook),
    onRenameChapter: vi.fn(async () => createdChapter),
    onCreateNotebook: vi.fn(async () => createdNotebook),
    onCreateChapter: vi.fn(async () => createdChapter),
    onCreatePage: vi.fn(async () => createdPage),
    onMovePage: vi.fn(async () => ({ movedPage: createdPage, swappedPage: null })),
    onDeletePage: vi.fn(async () => undefined),
    onSavePage: vi.fn(async () => createdPage),
  });

  /** Build two existing selectable pages for NAV-ESCAPE regressions. */
  const createNavigationFixture = (ownerId: string, key: string) => {
    const tree = createTree();
    const currentPage: Page = {
      ...createdPage,
      id: key + "-current",
      title: "Página original",
      content: {
        type: "document",
        blocks: [{ type: "paragraph", content: "Conteúdo original." }],
      },
    };
    const nextPage: Page = {
      ...createdPage,
      id: key + "-next",
      title: "Página seguinte",
      position: 1,
    };
    tree.grimoires[0]!.ownerId = ownerId;
    tree.grimoires[0]!.notebooks![0]!.chapters![0]!.pages = [currentPage, nextPage];
    return {
      tree,
      currentPage,
      nextPage,
      selection: {
        grimoireId: "g1",
        notebookId: "n1",
        chapterId: "c1",
        pageId: currentPage.id,
      },
    };
  };

  const beginUnansweredSave = (draftTitle: string) => {
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: draftTitle } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar página" }));
  };

  const attestManualRecoveryCopy = () => {
    fireEvent.click(screen.getByRole("button", {
      name: "Confirmo que já baixei uma cópia TXT ou JSON desta revisão",
    }));
  };

  test("NAV-01 blocks internal selection until the current pending revision is exported and attested", () => {
    const { tree, currentPage, nextPage, selection } =
      createNavigationFixture("owner-nav-01", "nav-01");
    const onSavePage = vi.fn(() => new Promise<Page>(() => undefined));
    const props = { ...shellProps(tree, selection), onSavePage };
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<WorkspaceShell {...props} />);

    beginUnansweredSave("Rascunho sem cópia confirmada");
    fireEvent.click(screen.getByRole("button", { name: nextPage.title }));

    expect(screen.getByLabelText("Título")).toHaveValue("Rascunho sem cópia confirmada");
    expect(screen.getByRole("button", { name: currentPage.title }))
      .toHaveAttribute("aria-current", "page");
    expect(confirm).not.toHaveBeenCalled();
    expect(onSavePage).toHaveBeenCalledTimes(1);
    confirm.mockRestore();
  });

  test("NAV-03 preserves the current selection when the second navigation confirmation is declined", () => {
    const { tree, currentPage, nextPage, selection } =
      createNavigationFixture("owner-nav-03", "nav-03");
    const onSavePage = vi.fn(() => new Promise<Page>(() => undefined));
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<WorkspaceShell {...shellProps(tree, selection)} onSavePage={onSavePage} />);

    beginUnansweredSave("Rascunho preservado ao cancelar");
    attestManualRecoveryCopy();
    fireEvent.click(screen.getByRole("button", { name: nextPage.title }));

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining(
      "mantendo o salvamento original pendente",
    ));
    expect(screen.getByLabelText("Título")).toHaveValue("Rascunho preservado ao cancelar");
    expect(screen.getByRole("button", { name: currentPage.title }))
      .toHaveAttribute("aria-current", "page");
    expect(onSavePage).toHaveBeenCalledTimes(1);
    confirm.mockRestore();
  });

  test("NAV-05 preserves the pending snapshot while navigating between existing Workspace items", () => {
    const { tree, currentPage, nextPage, selection } =
      createNavigationFixture("owner-nav-05", "nav-05");
    const onSavePage = vi.fn(() => new Promise<Page>(() => undefined));
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<WorkspaceShell {...shellProps(tree, selection)} onSavePage={onSavePage} />);

    beginUnansweredSave("Rascunho mantido na memória");
    attestManualRecoveryCopy();
    fireEvent.click(screen.getByRole("button", { name: nextPage.title }));
    expect(screen.getByLabelText("Título")).toHaveValue(nextPage.title);

    fireEvent.click(screen.getByRole("button", { name: currentPage.title }));
    expect(screen.getByLabelText("Título")).toHaveValue("Rascunho mantido na memória");
    expect(screen.getByText(/Você confirmou a cópia manual da revisão 1/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aguardando confirmação…" })).toBeDisabled();
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(onSavePage).toHaveBeenCalledTimes(1);
    confirm.mockRestore();
  });

  test("NAV-06 reconciles the original save response after an authorized internal selection change", async () => {
    const { tree, currentPage, nextPage, selection } =
      createNavigationFixture("owner-nav-06", "nav-06");
    let resolveOriginalSave!: (saved: Page) => void;
    const onSavePage = vi.fn(() => new Promise<Page>((resolve) => {
      resolveOriginalSave = resolve;
    }));
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<WorkspaceShell {...shellProps(tree, selection)} onSavePage={onSavePage} />);

    beginUnansweredSave("Revisão que será confirmada");
    attestManualRecoveryCopy();
    fireEvent.click(screen.getByRole("button", { name: nextPage.title }));
    expect(screen.getByLabelText("Título")).toHaveValue(nextPage.title);

    await act(async () => {
      resolveOriginalSave({
        ...currentPage,
        title: "Revisão que será confirmada",
      });
    });
    fireEvent.click(screen.getByRole("button", { name: currentPage.title }));

    expect(await screen.findByText("Página salva.")).toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toHaveValue("Revisão que será confirmada");
    expect(onSavePage).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveBeenCalledTimes(1);
    confirm.mockRestore();
  });

  test("NAV-07 keeps a never-resolving save unconfirmed after internal navigation and return", () => {
    const { tree, currentPage, nextPage, selection } =
      createNavigationFixture("owner-nav-07", "nav-07");
    const onSavePage = vi.fn(() => new Promise<Page>(() => undefined));
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<WorkspaceShell {...shellProps(tree, selection)} onSavePage={onSavePage} />);

    beginUnansweredSave("Rascunho sem resposta");
    attestManualRecoveryCopy();
    fireEvent.click(screen.getByRole("button", { name: nextPage.title }));
    fireEvent.click(screen.getByRole("button", { name: currentPage.title }));

    expect(screen.getByLabelText("Título")).toHaveValue("Rascunho sem resposta");
    expect(screen.getByText("Salvamento sem confirmação. Seu rascunho continua nesta aba."))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aguardando confirmação…" })).toBeDisabled();
    expect(screen.queryByText("Página salva.")).not.toBeInTheDocument();
    expect(onSavePage).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveBeenCalledTimes(1);
    confirm.mockRestore();
  });

  test("NAV-08 keeps creation, deletion, external links, forms and document exit blocked while saving is unknown", async () => {
    const { tree, currentPage, selection } =
      createNavigationFixture("owner-nav-08", "nav-08");
    const onSavePage = vi.fn(() => new Promise<Page>(() => undefined));
    const onCreatePage = vi.fn(async () => createdPage);
    const onDeletePage = vi.fn(async () => undefined);
    const props = {
      ...shellProps(tree, selection),
      onSavePage,
      onCreatePage,
      onDeletePage,
    };
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<WorkspaceShell {...props} />);

    beginUnansweredSave("Rascunho protegido contra saídas");
    attestManualRecoveryCopy();

    fireEvent.change(screen.getByLabelText("Nova página"), {
      target: { value: "Não criar durante salvamento desconhecido" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar página" }));
    expect(await screen.findByText("Não foi possível criar a página.")).toBeInTheDocument();
    expect(onCreatePage).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Excluir página" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar exclusão" }));
    expect(await screen.findByText("Não foi possível excluir a página.")).toBeInTheDocument();
    expect(onDeletePage).not.toHaveBeenCalled();

    const external = document.createElement("a");
    external.href = "https://external.example/workspace";
    document.body.appendChild(external);
    const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    external.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);

    const externalForm = document.createElement("form");
    document.body.appendChild(externalForm);
    const submit = new Event("submit", { bubbles: true, cancelable: true });
    externalForm.dispatchEvent(submit);
    expect(submit.defaultPrevented).toBe(true);

    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);

    expect(screen.getByLabelText("Título")).toHaveValue("Rascunho protegido contra saídas");
    expect(onSavePage).toHaveBeenCalledTimes(1);
    expect(confirm).not.toHaveBeenCalled();
    external.remove();
    externalForm.remove();
    confirm.mockRestore();
    expect(currentPage.id).toBe(selection.pageId);
  });

  test("NAV-09 never restores a pending draft into another owner with the same page id", () => {
    const { tree, currentPage, selection } =
      createNavigationFixture("owner-nav-09-a", "nav-09");
    const sharedPageId = currentPage.id;
    const first = render(<WorkspaceShell {...shellProps(tree, selection)}
      onSavePage={vi.fn(() => new Promise<Page>(() => undefined))} />);
    beginUnansweredSave("Rascunho do proprietário A");
    attestManualRecoveryCopy();
    first.unmount();

    const otherTree = createTree();
    otherTree.grimoires[0]!.ownerId = "owner-nav-09-b";
    otherTree.grimoires[0]!.notebooks![0]!.chapters![0]!.pages = [{
      ...createdPage,
      id: sharedPageId,
      title: "Página do proprietário B",
    }];
    render(<WorkspaceShell {...shellProps(otherTree, {
      grimoireId: "g1", notebookId: "n1", chapterId: "c1", pageId: sharedPageId,
    })} />);

    expect(screen.getByLabelText("Título")).toHaveValue("Página do proprietário B");
    expect(screen.queryByDisplayValue("Rascunho do proprietário A")).not.toBeInTheDocument();
    expect(screen.queryByText(/Você confirmou a cópia manual/)).not.toBeInTheDocument();
  });

  test("recovers an authorized page selection after a stale revalidation remount", async () => {
    const tree = createTree();
    tree.grimoires[0]!.notebooks![0]!.chapters![0]!.pages = [createdPage];
    window.history.replaceState({}, "", "/workspace?view=tree&page=p1#current");
    render(<WorkspaceShell {...shellProps(tree, {
      grimoireId: null, notebookId: null, chapterId: null, pageId: null,
    })} />);

    await waitFor(() =>
      expect(screen.getByRole("article", { name: "Editor da página" })).toBeInTheDocument(),
    );
    expect(window.location.pathname + window.location.search + window.location.hash)
      .toBe("/workspace?view=tree&page=p1#current");
    expect(screen.getByRole("button", { name: "Nova página" }))
      .toHaveAttribute("aria-current", "page");
  });

  test("does not open a foreign page from an untrusted URL", async () => {
    const tree = createTree();
    tree.grimoires[0]!.notebooks![0]!.chapters![0]!.pages = [createdPage];
    window.history.replaceState({}, "", "/workspace?view=tree&page=foreign#current");
    render(<WorkspaceShell {...shellProps(tree, {
      grimoireId: null, notebookId: null, chapterId: null, pageId: null,
    })} />);

    await waitFor(() =>
      expect(window.location.pathname + window.location.search + window.location.hash)
        .toBe("/workspace?view=tree#current"),
    );
    expect(screen.queryByRole("article", { name: "Editor da página" }))
      .not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("Nova página")).not.toBeInTheDocument();
  });

  test("derives page ancestors from the authorized tree, not forged URL parameters", async () => {
    const tree = createTree();
    tree.grimoires[0]!.notebooks![0]!.chapters![0]!.pages = [createdPage];
    window.history.replaceState({}, "", "/workspace?view=tree&grimoire=foreign&page=p1#current");
    render(<WorkspaceShell {...shellProps(tree, {
      grimoireId: null, notebookId: null, chapterId: null, pageId: null,
    })} />);

    await waitFor(() =>
      expect(screen.getByRole("article", { name: "Editor da página" })).toBeInTheDocument(),
    );
    expect(window.location.search).toBe("?view=tree&page=p1");
    expect(screen.getByRole("button", { name: "Grimório" }))
      .toHaveAttribute("data-active-path", "true");
  });

  test("does not duplicate a grimoire after the server tree refreshes", async () => {
    const props = shellProps({ grimoires: [] }, {
      grimoireId: null, notebookId: null, chapterId: null, pageId: null,
    });
    const { rerender } = render(<WorkspaceShell {...props} />);
    fireEvent.change(screen.getByLabelText("Novo grimório"), {
      target: { value: "Novo grimório" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar grimório" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Novo grimório" }))
        .toHaveAttribute("aria-current", "true"),
    );
    rerender(<WorkspaceShell {...props} tree={{
      grimoires: [{ ...createdGrimoire, notebooks: [] }],
    }} />);
    expect(screen.getAllByRole("button", { name: "Novo grimório" })).toHaveLength(1);
  });

  test("does not duplicate a notebook after the server tree refreshes", async () => {
    const tree = createTree();
    tree.grimoires[0]!.notebooks = [];
    const props = shellProps(tree, {
      grimoireId: "g1", notebookId: null, chapterId: null, pageId: null,
    });
    const { rerender } = render(<WorkspaceShell {...props} />);
    fireEvent.change(screen.getByLabelText("Novo caderno"), {
      target: { value: "Novo caderno" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar caderno" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Novo caderno" }))
        .toHaveAttribute("aria-current", "true"),
    );
    const refreshed = createTree();
    refreshed.grimoires[0]!.notebooks = [{ ...createdNotebook, chapters: [] }];
    rerender(<WorkspaceShell {...props} tree={refreshed} />);
    expect(screen.getAllByRole("button", { name: "Novo caderno" })).toHaveLength(1);
  });

  test("does not duplicate a chapter after the server tree refreshes", async () => {
    const tree = createTree();
    tree.grimoires[0]!.notebooks![0]!.chapters = [];
    const props = shellProps(tree, {
      grimoireId: "g1", notebookId: "n1", chapterId: null, pageId: null,
    });
    const { rerender } = render(<WorkspaceShell {...props} />);
    fireEvent.change(screen.getByLabelText("Novo capítulo"), {
      target: { value: "Novo capítulo" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar capítulo" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Novo capítulo" }))
        .toHaveAttribute("aria-current", "true"),
    );
    const refreshed = createTree();
    refreshed.grimoires[0]!.notebooks![0]!.chapters = [{ ...createdChapter, pages: [] }];
    rerender(<WorkspaceShell {...props} tree={refreshed} />);
    expect(screen.getAllByRole("button", { name: "Novo capítulo" })).toHaveLength(1);
  });

  test("does not duplicate a page after the server tree refreshes", async () => {
    const props = shellProps(createTree(), {
      grimoireId: "g1", notebookId: "n1", chapterId: "c1", pageId: null,
    });
    const { rerender } = render(<WorkspaceShell {...props} />);
    fireEvent.change(screen.getByLabelText("Nova página"), {
      target: { value: "Nova página" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar página" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Nova página" }))
        .toHaveAttribute("aria-current", "page"),
    );
    const refreshed = createTree();
    refreshed.grimoires[0]!.notebooks![0]!.chapters![0]!.pages = [createdPage];
    rerender(<WorkspaceShell {...props} tree={refreshed} />);
    expect(screen.getAllByRole("button", { name: "Nova página" })).toHaveLength(1);
    expect(screen.getByRole("article", { name: "Editor da página" })).toBeInTheDocument();
  });
  test.each([false, true])(
    "preserves an edit while page creation is pending (dirty before request: %s)",
    async (dirtyBeforeRequest) => {
      const tree = createTree();
      const original = {
        ...createdPage,
        id: "p-create-race-" + String(dirtyBeforeRequest),
        title: "Página original",
      };
      tree.grimoires[0]!.ownerId = "owner-create-race-" + String(dirtyBeforeRequest);
      tree.grimoires[0]!.notebooks![0]!.chapters![0]!.pages = [original];
      const added = {
        ...createdPage,
        id: "p-added-race-" + String(dirtyBeforeRequest),
        title: "Página criada",
        position: 1,
      };
      let completeCreate!: (created: Page) => void;
      const onCreatePage = vi.fn(() => new Promise<Page>((resolve) => { completeCreate = resolve; }));
      const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
      render(<WorkspaceShell
        {...shellProps(tree, { grimoireId: "g1", notebookId: "n1", chapterId: "c1", pageId: original.id })}
        onCreatePage={onCreatePage}
      />);
      if (dirtyBeforeRequest) {
        fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Rascunho inicial" } });
      }
      fireEvent.change(screen.getByLabelText("Nova página"), { target: { value: "Página criada" } });
      fireEvent.click(screen.getByRole("button", { name: "Criar página" }));
      expect(onCreatePage).toHaveBeenCalledTimes(1);
      expect(confirm).toHaveBeenCalledTimes(dirtyBeforeRequest ? 1 : 0);
      fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Edição durante criação" } });
      await act(async () => { completeCreate(added); });
      expect(screen.getByLabelText("Título")).toHaveValue("Edição durante criação");
      expect(screen.getByRole("button", { name: "Página original" }))
        .toHaveAttribute("aria-current", "page");
      expect(screen.getByRole("button", { name: "Página criada" })).toBeInTheDocument();
      expect(screen.getByText("Item criado. Sua seleção e alterações recentes foram preservadas. Salve a página antes de abrir o novo item."))
        .toBeInTheDocument();
      confirm.mockRestore();
    },
  );

  test("preserves a more recent selection after an earlier page creation", async () => {
    const tree = createTree();
    const original = { ...createdPage, id: "p-later-selection", title: "Página atual" };
    tree.grimoires[0]!.ownerId = "owner-later-selection";
    tree.grimoires[0]!.notebooks![0]!.chapters![0]!.pages = [original];
    let completeCreate!: (created: Page) => void;
    const onCreatePage = vi.fn(() => new Promise<Page>((resolve) => { completeCreate = resolve; }));
    render(<WorkspaceShell
      {...shellProps(tree, { grimoireId: "g1", notebookId: "n1", chapterId: "c1", pageId: null })}
      onCreatePage={onCreatePage}
    />);
    fireEvent.change(screen.getByLabelText("Nova página"), { target: { value: "Nova página assíncrona" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar página" }));
    fireEvent.click(screen.getByRole("button", { name: "Página atual" }));
    await act(async () => {
      completeCreate({ ...createdPage, id: "p-async-created", title: "Nova página assíncrona", position: 1 });
    });
    expect(screen.getByLabelText("Título")).toHaveValue("Página atual");
    expect(screen.getByRole("button", { name: "Página atual" }))
      .toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Nova página assíncrona" }))
      .not.toHaveAttribute("aria-current", "page");
  });

  test("guards external links with an identical path and query", () => {
    const tree = createTree();
    const currentPage = { ...createdPage, id: "p-cross-origin", title: "Página privada" };
    tree.grimoires[0]!.ownerId = "owner-cross-origin";
    tree.grimoires[0]!.notebooks![0]!.chapters![0]!.pages = [currentPage];
    render(<WorkspaceShell {...shellProps(tree, {
      grimoireId: "g1", notebookId: "n1", chapterId: "c1", pageId: currentPage.id,
    })} />);
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Rascunho local" } });
    const external = document.createElement("a");
    external.href = "https://external.example" + window.location.pathname + window.location.search;
    document.body.appendChild(external);
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    try {
      const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
      external.dispatchEvent(click);
      expect(click.defaultPrevented).toBe(true);
      expect(confirm).toHaveBeenCalledTimes(1);
      expect(screen.getByLabelText("Título")).toHaveValue("Rascunho local");
    } finally {
      external.remove();
      confirm.mockRestore();
    }
  });

});
