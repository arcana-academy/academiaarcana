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

export function WorkspaceShell({
  tree,
  initialState,
}: WorkspaceShellProps) {
  const [state, setState] = useState<WorkspaceState>(initialState);

  const title = useMemo(() => {
    if (state.pageId) {
      for (const grimoire of tree.grimoires) {
        for (const notebook of grimoire.notebooks ?? []) {
          for (const chapter of notebook.chapters ?? []) {
            const page = chapter.pages?.find((item) => item.id === state.pageId);
            if (page) return page.title;
          }
        }
      }
    }

    if (state.chapterId) {
      for (const grimoire of tree.grimoires) {
        for (const notebook of grimoire.notebooks ?? []) {
          const chapter = notebook.chapters?.find(
            (item) => item.id === state.chapterId,
          );
          if (chapter) return chapter.title;
        }
      }
    }

    if (state.notebookId) {
      for (const grimoire of tree.grimoires) {
        const notebook = grimoire.notebooks?.find(
          (item) => item.id === state.notebookId,
        );
        if (notebook) return notebook.title;
      }
    }

    if (state.grimoireId) {
      const grimoire = tree.grimoires.find(
        (item) => item.id === state.grimoireId,
      );
      if (grimoire) return grimoire.title;
    }

    return "Workspace";
  }, [state, tree]);

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
