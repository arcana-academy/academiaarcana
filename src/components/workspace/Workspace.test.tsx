// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { Workspace } from "./Workspace";

describe("Workspace", () => {
  test("renders the three-region workspace shell with actionable empty state", () => {
    render(
      <Workspace
        tree={{ grimoires: [] }}
        state={{
          grimoireId: null,
          notebookId: null,
          chapterId: null,
          pageId: null,
        }}
        title="Academia Arcana"
        selectedPage={null}
        onOpenGrimoire={vi.fn()}
        onOpenNotebook={vi.fn()}
        onOpenChapter={vi.fn()}
        onOpenPage={vi.fn()}
        onCreateGrimoire={vi.fn(() => Promise.reject(new Error("not used in this test")))}
        onRenameGrimoire={vi.fn(() => Promise.reject(new Error("not used in this test")))}
        onRenameNotebook={vi.fn(() => Promise.reject(new Error("not used in this test")))}
        onRenameChapter={vi.fn(() => Promise.reject(new Error("not used in this test")))}
        onCreateNotebook={vi.fn(() => Promise.reject(new Error("not used in this test")))}
        onCreateChapter={vi.fn(() => Promise.reject(new Error("not used in this test")))}
        onCreatePage={vi.fn(() =>
          Promise.reject(new Error("not used in this test")),
        )}
        canMovePageUp={false}
        canMovePageDown={false}
        onMovePage={vi.fn(() =>
          Promise.reject(new Error("not used in this test")),
        )}
        onDeletePage={vi.fn(() =>
          Promise.reject(new Error("not used in this test")),
        )}
        onSavePage={vi.fn(() =>
          Promise.reject(new Error("not used in this test")),
        )}
      />,
    );

    expect(screen.getByRole("banner")).toBeTruthy();
    expect(
      screen.getByRole("navigation", { name: "Navegação do editor de estudos" }),
    ).toBeTruthy();
    const editorRegion = screen.getByRole("region", { name: "Área de trabalho" });
    // Every canonical deep link (including Santuário resume) uses #current.
    // Keep its anchor attached to the actual editor, and allow keyboard focus.
    expect(editorRegion).toHaveAttribute("id", "current");
    expect(screen.getByRole("link", { name: "Ir para o editor da página" })).toHaveAttribute("href", "#current");
    expect(editorRegion).toHaveAttribute("tabindex", "-1");
    editorRegion.focus();
    expect(editorRegion).toHaveFocus();
    expect(
      screen.getByRole("complementary", { name: "Contexto" }),
    ).toBeTruthy();
    expect(screen.queryByRole("main")).toBeNull();

    const createAction = screen.getByRole("button", {
      name: "Criar um grimório",
    });
    expect(
      screen.getByRole("link", { name: "Explorar Grimórios" }),
    ).toHaveAttribute("href", "/grimorios");

    fireEvent.click(createAction);
    expect(screen.getByLabelText("Novo grimório")).toHaveFocus();
  });

  test("moves keyboard focus to the actual editor only after a user selects a page", async () => {
    const page = {
      id: "p1",
      chapterId: "c1",
      title: "Dor lombar",
      content: { type: "document" as const, blocks: [] },
      position: 0,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };
    const tree: Parameters<typeof Workspace>[0]["tree"] = {
      grimoires: [{
        id: "g1", ownerId: "u1", title: "Anatomia",
        createdAt: "2026-01-01", updatedAt: "2026-01-01",
        notebooks: [{
          id: "n1", grimoireId: "g1", title: "Corpo", position: 0,
          createdAt: "2026-01-01", updatedAt: "2026-01-01",
          chapters: [{
            id: "c1", notebookId: "n1", title: "Coluna", position: 0,
            createdAt: "2026-01-01", updatedAt: "2026-01-01",
            pages: [page],
          }],
        }],
      }],
    };
    const onOpenPage = vi.fn();
    const handlers = {
      onOpenGrimoire: vi.fn(),
      onOpenNotebook: vi.fn(),
      onOpenChapter: vi.fn(),
      onOpenPage,
      onCreateGrimoire: vi.fn(),
      onRenameGrimoire: vi.fn(),
      onRenameNotebook: vi.fn(),
      onRenameChapter: vi.fn(),
      onCreateNotebook: vi.fn(),
      onCreateChapter: vi.fn(),
      onCreatePage: vi.fn(),
      onMovePage: vi.fn(),
      onDeletePage: vi.fn(),
      onSavePage: vi.fn(),
    };
    const state = {
      grimoireId: "g1",
      notebookId: "n1",
      chapterId: "c1",
      pageId: null as string | null,
    };
    const { rerender } = render(
      <Workspace
        {...handlers}
        tree={tree}
        state={state}
        title="Anatomia"
        selectedPage={null}
        canMovePageUp={false}
        canMovePageDown={false}
      />,
    );
    const region = screen.getByRole("region", { name: "Área de trabalho" });
    expect(region).not.toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "Dor lombar" }));
    expect(onOpenPage).toHaveBeenCalledWith("p1");
    rerender(
      <Workspace
        {...handlers}
        tree={tree}
        state={{ ...state, pageId: "p1" }}
        title="Anatomia"
        selectedPage={page}
        canMovePageUp={false}
        canMovePageDown={false}
      />,
    );
    await waitFor(() => expect(region).toHaveFocus());
  });
});
