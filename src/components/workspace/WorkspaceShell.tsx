"use client";

import { useMemo, useState } from "react";

import type { WorkspaceState } from "@/domains/learning";
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
};

/** Resolve the visible Workspace title from the selected hierarchy state. */
function findWorkspaceTitle(
  tree: WorkspaceTree,
  state: WorkspaceState,
): string {
  const pages = tree.grimoires.flatMap((grimoire) =>
    (grimoire.notebooks ?? []).flatMap((notebook) =>
      (notebook.chapters ?? []).flatMap((chapter) => chapter.pages ?? []),
    ),
  );
  const page = pages.find((item) => item.id === state.pageId);
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

/** Manage client-side Workspace selection while preserving the server tree. */
export function WorkspaceShell({
  tree,
  initialState,
}: WorkspaceShellProps) {
  const [state, setState] = useState<WorkspaceState>(initialState);
  const title = useMemo(
    () => findWorkspaceTitle(tree, state),
    [state, tree],
  );

  return (
    <Workspace
      tree={tree}
      state={state}
      title={title}
      onOpenGrimoire={(id) => setState((current) => openGrimoire(current, id))}
      onOpenNotebook={(id) => setState((current) => openNotebook(current, id))}
      onOpenChapter={(id) => setState((current) => openChapter(current, id))}
      onOpenPage={(id) => setState((current) => openPage(current, id))}
    />
  );
}
