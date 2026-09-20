"use client";

import { useMemo, useState } from "react";

import type { Page, WorkspaceState } from "@/domains/learning";
import {
  openChapter,
  openGrimoire,
  openNotebook,
  openPage,
} from "@/application/learning/workspace/state";

import { Workspace } from "./Workspace";

type WorkspaceTree = Parameters<typeof Workspace>[0]["tree"];

type WorkspaceShellProps = {
  tree: WorkspaceTree;
  initialState: WorkspaceState;
  onSavePage: (input: {
    id: string;
    title: string;
    content: Page["content"];
  }) => Promise<Page>;
};

function findSelectedPage(
  tree: WorkspaceTree,
  state: WorkspaceState,
): Page | null {
  for (const grimoire of tree.grimoires) {
    for (const notebook of grimoire.notebooks ?? []) {
      for (const chapter of notebook.chapters ?? []) {
        const page = chapter.pages?.find((item) => item.id === state.pageId);
        if (page) return page;
      }
    }
  }

  return null;
}

function findWorkspaceTitle(
  tree: WorkspaceTree,
  state: WorkspaceState,
): string {
  const page = findSelectedPage(tree, state);
  if (page) return page.title;

  const chapters = tree.grimoires.flatMap((grimoire) =>
    (grimoire.notebooks ?? []).flatMap((notebook) => notebook.chapters ?? []),
  );
  const chapter = chapters.find((item) => item.id === state.chapterId);
  if (chapter) return chapter.title;

  const notebooks = tree.grimoires.flatMap(
    (grimoire) => grimoire.notebooks ?? [],
  );
  const notebook = notebooks.find((item) => item.id === state.notebookId);
  if (notebook) return notebook.title;

  const grimoire = tree.grimoires.find(
    (item) => item.id === state.grimoireId,
  );
  if (grimoire) return grimoire.title;

  return "Workspace";
}

export function WorkspaceShell({
  tree,
  initialState,
  onSavePage,
}: WorkspaceShellProps) {
  const [state, setState] = useState<WorkspaceState>(initialState);
  const [pages, setPages] = useState<Record<string, Page>>({});

  const selectedPage = useMemo(() => {
    const persistedPage = findSelectedPage(tree, state);
    if (!persistedPage) return null;

    return pages[persistedPage.id] ?? persistedPage;
  }, [pages, state, tree]);

  const title = useMemo(
    () => (selectedPage ? selectedPage.title : findWorkspaceTitle(tree, state)),
    [selectedPage, state, tree],
  );

  const savePage = async (input: {
    id: string;
    title: string;
    content: Page["content"];
  }) => {
    const saved = await onSavePage(input);
    setPages((current) => ({ ...current, [saved.id]: saved }));
    return saved;
  };

  return (
    <Workspace
      tree={tree}
      state={state}
      title={title}
      selectedPage={selectedPage}
      onOpenGrimoire={(id) => setState((current) => openGrimoire(current, id))}
      onOpenNotebook={(id) => setState((current) => openNotebook(current, id))}
      onOpenChapter={(id) => setState((current) => openChapter(current, id))}
      onOpenPage={(id) => setState((current) => openPage(current, id))}
      onSavePage={savePage}
    />
  );
}
