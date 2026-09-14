import { describe, expect, it } from "vitest";

import type { WorkspaceState } from "@/domains/learning/workspace";
import { openChapter, openGrimoire, openNotebook, openPage } from "./state";

describe("workspace navigation state", () => {
  const initialState: WorkspaceState = {
    grimoireId: null,
    notebookId: null,
    chapterId: null,
    pageId: null,
  };

  it("opens a grimoire and clears descendant selections", () => {
    const state: WorkspaceState = {
      grimoireId: "grimoire-old",
      notebookId: "notebook-old",
      chapterId: "chapter-old",
      pageId: "page-old",
    };

    expect(openGrimoire(state, "grimoire-new")).toEqual({
      grimoireId: "grimoire-new",
      notebookId: null,
      chapterId: null,
      pageId: null,
    });
  });

  it("opens a notebook while preserving its grimoire", () => {
    expect(
      openNotebook(
        {
          ...initialState,
          grimoireId: "grimoire-1",
          notebookId: "notebook-old",
          chapterId: "chapter-old",
          pageId: "page-old",
        },
        "notebook-1",
      ),
    ).toEqual({
      grimoireId: "grimoire-1",
      notebookId: "notebook-1",
      chapterId: null,
      pageId: null,
    });
  });

  it("opens a chapter while preserving its ancestors", () => {
    expect(
      openChapter(
        {
          ...initialState,
          grimoireId: "grimoire-1",
          notebookId: "notebook-1",
          pageId: "page-old",
        },
        "chapter-1",
      ),
    ).toEqual({
      grimoireId: "grimoire-1",
      notebookId: "notebook-1",
      chapterId: "chapter-1",
      pageId: null,
    });
  });

  it("opens a page while preserving the complete hierarchy", () => {
    expect(
      openPage(
        {
          grimoireId: "grimoire-1",
          notebookId: "notebook-1",
          chapterId: "chapter-1",
          pageId: null,
        },
        "page-1",
      ),
    ).toEqual({
      grimoireId: "grimoire-1",
      notebookId: "notebook-1",
      chapterId: "chapter-1",
      pageId: "page-1",
    });
  });

  it("does not mutate the previous state", () => {
    const state: WorkspaceState = {
      grimoireId: "grimoire-1",
      notebookId: "notebook-1",
      chapterId: "chapter-1",
      pageId: "page-1",
    };

    const nextState = openNotebook(state, "notebook-2");

    expect(state).toEqual({
      grimoireId: "grimoire-1",
      notebookId: "notebook-1",
      chapterId: "chapter-1",
      pageId: "page-1",
    });

    expect(nextState).not.toBe(state);
  });
});