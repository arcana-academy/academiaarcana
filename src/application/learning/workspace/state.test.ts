import { describe, expect, it } from "vitest";

import type { WorkspaceState } from "@/domains/learning";
import {
  getWorkspaceCanonicalHref,
  openChapter,
  openGrimoire,
  openNotebook,
  openPage,
  resolveWorkspaceState,
} from "./state";

const hierarchy = {
  grimoires: [
    {
      id: "g1",
      notebooks: [
        {
          id: "n1",
          chapters: [
            {
              id: "c1",
              pages: [{ id: "p1" }, { id: "p2" }],
            },
          ],
        },
      ],
    },
    {
      id: "g2",
      notebooks: [
        {
          id: "n2",
          chapters: [
            {
              id: "c2",
              pages: [{ id: "p3" }],
            },
          ],
        },
      ],
    },
  ],
};

describe("workspace deep-link resolution", () => {
  it("reconstructs the complete hierarchy for a valid page-only request", () => {
    expect(
      resolveWorkspaceState(hierarchy, { pageId: "p1" }),
    ).toEqual({
      grimoireId: "g1",
      notebookId: "n1",
      chapterId: "c1",
      pageId: "p1",
    });
  });

  it("reconstructs ancestors for a valid chapter-only request", () => {
    expect(
      resolveWorkspaceState(hierarchy, { chapterId: "c1" }),
    ).toEqual({
      grimoireId: "g1",
      notebookId: "n1",
      chapterId: "c1",
      pageId: null,
    });
  });

  it("reconstructs the grimoire for a valid notebook-only request", () => {
    expect(
      resolveWorkspaceState(hierarchy, { notebookId: "n1" }),
    ).toEqual({
      grimoireId: "g1",
      notebookId: "n1",
      chapterId: null,
      pageId: null,
    });
  });

  it("keeps a valid grimoire-only request", () => {
    expect(
      resolveWorkspaceState(hierarchy, { grimoireId: "g1" }),
    ).toEqual({
      grimoireId: "g1",
      notebookId: null,
      chapterId: null,
      pageId: null,
    });
  });

  it("does not create a ghost selection for stale identifiers", () => {
    expect(
      resolveWorkspaceState(hierarchy, {
        grimoireId: "stale-g",
        notebookId: "stale-n",
        chapterId: "stale-c",
        pageId: "stale-p",
      }),
    ).toEqual({
      grimoireId: null,
      notebookId: null,
      chapterId: null,
      pageId: null,
    });
  });

  it("lets the most-specific valid page determine its real ancestors", () => {
    expect(
      resolveWorkspaceState(hierarchy, {
        grimoireId: "g2",
        notebookId: "n2",
        chapterId: "c2",
        pageId: "p1",
      }),
    ).toEqual({
      grimoireId: "g1",
      notebookId: "n1",
      chapterId: "c1",
      pageId: "p1",
    });
  });

  it("falls back to the next valid level when a more-specific identifier is stale", () => {
    expect(
      resolveWorkspaceState(hierarchy, {
        grimoireId: "g2",
        notebookId: "n2",
        chapterId: "c2",
        pageId: "stale-p",
      }),
    ).toEqual({
      grimoireId: "g2",
      notebookId: "n2",
      chapterId: "c2",
      pageId: null,
    });
  });
});

describe("workspace canonical URL", () => {
  it.each([
    [
      {
        grimoireId: "g1",
        notebookId: null,
        chapterId: null,
        pageId: null,
      },
      "/workspace?view=tree&grimoire=g1#current",
    ],
    [
      {
        grimoireId: "g1",
        notebookId: "n1",
        chapterId: null,
        pageId: null,
      },
      "/workspace?view=tree&notebook=n1#current",
    ],
    [
      {
        grimoireId: "g1",
        notebookId: "n1",
        chapterId: "c1",
        pageId: null,
      },
      "/workspace?view=tree&chapter=c1#current",
    ],
    [
      {
        grimoireId: "g1",
        notebookId: "n1",
        chapterId: "c1",
        pageId: "p1",
      },
      "/workspace?view=tree&page=p1#current",
    ],
  ] as Array<[WorkspaceState, string]>)(
    "serializes only the most-specific selection",
    (state, href) => {
      expect(getWorkspaceCanonicalHref(state)).toBe(href);
    },
  );

  it("keeps the Workspace view and current anchor with no selection", () => {
    expect(
      getWorkspaceCanonicalHref({
        grimoireId: null,
        notebookId: null,
        chapterId: null,
        pageId: null,
      }),
    ).toBe("/workspace?view=tree#current");
  });

  it("encodes a selected identifier before placing it in the URL", () => {
    expect(
      getWorkspaceCanonicalHref({
        grimoireId: "g1",
        notebookId: "n1",
        chapterId: "c1",
        pageId: "page/with space",
      }),
    ).toBe("/workspace?view=tree&page=page%2Fwith%20space#current");
  });

  it("round-trips a canonical page URL through the authorized hierarchy resolver", () => {
    const state: WorkspaceState = {
      grimoireId: "g1",
      notebookId: "n1",
      chapterId: "c1",
      pageId: "p1",
    };
    const url = new URL(getWorkspaceCanonicalHref(state), "https://example.test");

    expect(
      resolveWorkspaceState(hierarchy, {
        grimoireId: url.searchParams.get("grimoire"),
        notebookId: url.searchParams.get("notebook"),
        chapterId: url.searchParams.get("chapter"),
        pageId: url.searchParams.get("page"),
      }),
    ).toEqual(state);
  });

  it("drops stale descendant parameters when a parent becomes the current selection", () => {
    expect(
      getWorkspaceCanonicalHref({
        grimoireId: "g1",
        notebookId: "n1",
        chapterId: "c1",
        pageId: null,
      }),
    ).toBe("/workspace?view=tree&chapter=c1#current");
  });
});

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
