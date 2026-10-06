import type { WorkspaceState } from "@/domains/learning";

export type WorkspaceSelectionRequest = {
  grimoireId?: string | null;
  notebookId?: string | null;
  chapterId?: string | null;
  pageId?: string | null;
};

type WorkspaceHierarchyTree = {
  grimoires: Array<{
    id: string;
    notebooks?: Array<{
      id: string;
      chapters?: Array<{
        id: string;
        pages?: Array<{
          id: string;
        }>;
      }>;
    }>;
  }>;
};

const EMPTY_WORKSPACE_STATE: WorkspaceState = {
  grimoireId: null,
  notebookId: null,
  chapterId: null,
  pageId: null,
};

/**
 * Resolve a requested Workspace selection against the authorized hierarchy.
 *
 * The most-specific valid identifier wins: page -> chapter -> notebook ->
 * grimoire. Ancestors are always derived from the loaded hierarchy rather than
 * trusted from URL parameters, so stale or conflicting query values cannot
 * create an impossible selection.
 */
export function resolveWorkspaceState(
  tree: WorkspaceHierarchyTree,
  requested: WorkspaceSelectionRequest,
): WorkspaceState {
  if (requested.pageId) {
    for (const grimoire of tree.grimoires) {
      for (const notebook of grimoire.notebooks ?? []) {
        for (const chapter of notebook.chapters ?? []) {
          const page = (chapter.pages ?? []).find(
            (item) => item.id === requested.pageId,
          );

          if (page) {
            return {
              grimoireId: grimoire.id,
              notebookId: notebook.id,
              chapterId: chapter.id,
              pageId: page.id,
            };
          }
        }
      }
    }
  }

  if (requested.chapterId) {
    for (const grimoire of tree.grimoires) {
      for (const notebook of grimoire.notebooks ?? []) {
        const chapter = (notebook.chapters ?? []).find(
          (item) => item.id === requested.chapterId,
        );

        if (chapter) {
          return {
            grimoireId: grimoire.id,
            notebookId: notebook.id,
            chapterId: chapter.id,
            pageId: null,
          };
        }
      }
    }
  }

  if (requested.notebookId) {
    for (const grimoire of tree.grimoires) {
      const notebook = (grimoire.notebooks ?? []).find(
        (item) => item.id === requested.notebookId,
      );

      if (notebook) {
        return {
          grimoireId: grimoire.id,
          notebookId: notebook.id,
          chapterId: null,
          pageId: null,
        };
      }
    }
  }

  if (requested.grimoireId) {
    const grimoire = tree.grimoires.find(
      (item) => item.id === requested.grimoireId,
    );

    if (grimoire) {
      return {
        grimoireId: grimoire.id,
        notebookId: null,
        chapterId: null,
        pageId: null,
      };
    }
  }

  return { ...EMPTY_WORKSPACE_STATE };
}

export function openGrimoire(
  state: WorkspaceState,
  grimoireId: string,
): WorkspaceState {
  return {
    grimoireId,
    notebookId: null,
    chapterId: null,
    pageId: null,
  };
}

export function openNotebook(
  state: WorkspaceState,
  notebookId: string,
): WorkspaceState {
  return {
    grimoireId: state.grimoireId,
    notebookId,
    chapterId: null,
    pageId: null,
  };
}

export function openChapter(
  state: WorkspaceState,
  chapterId: string,
): WorkspaceState {
  return {
    grimoireId: state.grimoireId,
    notebookId: state.notebookId,
    chapterId,
    pageId: null,
  };
}

export function openPage(
  state: WorkspaceState,
  pageId: string,
): WorkspaceState {
  return {
    grimoireId: state.grimoireId,
    notebookId: state.notebookId,
    chapterId: state.chapterId,
    pageId,
  };
}
