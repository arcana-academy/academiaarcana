import type { WorkspaceState } from "@/domains/learning";

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
