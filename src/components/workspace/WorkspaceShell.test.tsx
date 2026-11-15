// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Chapter, Grimoire, Notebook, Page } from "@/domains/learning";
import { WorkspaceShell } from "./WorkspaceShell";

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
});
