// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import type { Chapter, Grimoire, Notebook, Page } from "@/domains/learning";
import { WorkspaceShell } from "./WorkspaceShell";

const createdGrimoire: Grimoire = {
  id: "g2",
  ownerId: "u1",
  title: "Novo grimório",
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-20T00:00:00.000Z",
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
function createTree() {
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
        onCreateGrimoire={onCreateGrimoire}
        onCreateNotebook={onCreateNotebook}
        onCreateChapter={onCreateChapter}
        onCreatePage={onCreatePage}
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
        onCreateNotebook={onCreateNotebook}
        onCreateChapter={onCreateChapter}
        onCreatePage={onCreatePage}
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
  });

  test("creates a chapter and selects it", async () => {
    const onCreateGrimoire = vi.fn(() => Promise.resolve(createdGrimoire));
    const onCreateChapter = vi.fn(() => Promise.resolve(createdChapter));
    const onCreatePage = vi.fn(() => Promise.resolve(createdPage));
    const onDeletePage = vi.fn(() => Promise.resolve());
    const onSavePage = vi.fn(() => Promise.resolve(createdPage));

    const tree = createTree();
    tree.grimoires[0].notebooks[0].chapters = [];

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
        onCreateNotebook={vi.fn(() => Promise.resolve(createdNotebook))}
        onCreateChapter={onCreateChapter}
        onCreatePage={onCreatePage}
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
        onCreateNotebook={vi.fn(() => Promise.resolve(createdNotebook))}
        onCreateChapter={vi.fn(() => Promise.resolve(createdChapter))}
        onCreatePage={onCreatePage}
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
});
