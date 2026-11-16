"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import type { Chapter, Grimoire, Notebook, Page, PageProgressStatus, WorkspaceState } from "@/domains/learning";
import {
  getWorkspaceCanonicalHref,
  openChapter,
  openGrimoire,
  openNotebook,
  openPage,
  resolveWorkspaceState,
} from "@/application/learning/workspace/state";

import { Workspace } from "./Workspace";
import type { WorkspaceDraftState } from "./PageEditor";

/** Volatile, client-only and owner-scoped; no database or browser storage writes. */
const transientDrafts: Map<string, WorkspaceDraftState> | null =
  typeof window === "undefined" ? null : new Map();
const draftSubscribers = new Set<() => void>();
const draftKey = (ownerId: string, pageId: string) => ownerId + ":" + pageId;
const subscribeDrafts = (listener: () => void) => {
  draftSubscribers.add(listener);
  return () => { draftSubscribers.delete(listener); };
};
const emptyDraftSnapshot = (): WorkspaceDraftState | null => null;
const readDraft = (ownerId: string | null, pageId: string | null) =>
  ownerId && pageId ? transientDrafts?.get(draftKey(ownerId, pageId)) ?? null : null;
function publishTransientDraft(ownerId: string, snapshot: WorkspaceDraftState): void {
  if (!transientDrafts) return;
  const key = draftKey(ownerId, snapshot.pageId);
  const previous = transientDrafts.get(key);
  // A late response may finish an older save, but cannot overwrite a newer edit.
  if (previous && previous.revision > snapshot.revision) {
    if (previous.saving && !snapshot.saving) {
      transientDrafts.set(key, {
        ...previous,
        saving: false,
        saveStatus: snapshot.saveStatus === "error" ? "error" : "idle",
      });
      draftSubscribers.forEach((listener) => listener());
    }
    return;
  }
  // Retain a confirmed acknowledgement until the selected editor observes it.
  // No storage outside this tab is created.
  if (snapshot.dirty || snapshot.saving || snapshot.saveStatus === "saved") {
    transientDrafts.set(key, snapshot);
  } else {
    transientDrafts.delete(key);
  }
  draftSubscribers.forEach((listener) => listener());
}
function discardTransientDraft(ownerId: string | null, pageId: string | null): void {
  if (!ownerId || !pageId || !transientDrafts) return;
  transientDrafts.delete(draftKey(ownerId, pageId));
  draftSubscribers.forEach((listener) => listener());
}


type WorkspaceTree = Parameters<typeof Workspace>[0]["tree"];

/** Snapshot the selection and draft authorizing an asynchronous creation. */
type CreationOrigin = {
  selection: WorkspaceState;
  selectionEpoch: number;
  ownerId: string | null;
  draft: WorkspaceDraftState | null;
};

function sameWorkspaceSelection(a: WorkspaceState, b: WorkspaceState): boolean {
  return a.grimoireId === b.grimoireId && a.notebookId === b.notebookId &&
    a.chapterId === b.chapterId && a.pageId === b.pageId;
}

type WorkspaceShellProps = {
  tree: WorkspaceTree;
  initialState: WorkspaceState;
  onCreateGrimoire: (input: { title: string }) => Promise<Grimoire>;
  onRenameGrimoire: (input: { id: string; title: string }) => Promise<Grimoire>;
  onRenameNotebook: (input: { id: string; title: string }) => Promise<Notebook>;
  onRenameChapter: (input: { id: string; title: string }) => Promise<Chapter>;
  onCreateNotebook: (input: { grimoireId: string; title: string }) => Promise<Notebook>;
  onCreateChapter: (input: { notebookId: string; title: string }) => Promise<Chapter>;
  onCreatePage: (input: { chapterId: string; title: string }) => Promise<Page>;
  onMovePage: (input: {
    id: string;
    direction: "up" | "down";
  }) => Promise<{
    movedPage: Page;
    swappedPage: Page | null;
  }>;
  onDeletePage: (id: string) => Promise<void>;
  onSavePage: (input: {
    id: string;
    title: string;
    content: Page["content"];
  }) => Promise<Page>;
  initialPageProgress?: Record<string, PageProgressStatus>;
  onSetPageProgress?: (input: {
    pageId: string;
    status: PageProgressStatus;
  }) => Promise<void>;
};

/** Find the selected page in the already-loaded Workspace hierarchy. */
function findSelectedPage(
  tree: WorkspaceTree,
  state: WorkspaceState,
): Page | null {
  const pages = tree.grimoires.flatMap((grimoire) =>
    (grimoire.notebooks ?? []).flatMap((notebook) =>
      (notebook.chapters ?? []).flatMap((chapter) => chapter.pages ?? []),
    ),
  );

  return pages.find((page) => page.id === state.pageId) ?? null;
}

/** Resolve the visible title for the current Workspace selection. */
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

/** Avoid duplicated items when the server tree refreshes after a successful creation. */
function mergePersistedAndCreated<T extends { id: string }>(
  persisted: T[],
  created: T[],
): T[] {
  const existingIds = new Set(persisted.map((item) => item.id));
  return [...persisted, ...created.filter((item) => !existingIds.has(item.id))];
}

/** Manage Workspace selection and saved page state on the client. */
export function WorkspaceShell({
  tree,
  initialState,
  onCreateGrimoire,
  onRenameGrimoire,
  onRenameNotebook,
  onRenameChapter,
  onCreateNotebook,
  onCreateChapter,
  onCreatePage,
  onMovePage,
  onDeletePage,
  onSavePage,
  initialPageProgress = {},
  onSetPageProgress = async () => undefined,
}: WorkspaceShellProps) {

  const [state, setState] = useState<WorkspaceState>(initialState);
  const latestSelectionRef = useRef(state);
  const selectionEpochRef = useRef(0);
  const initialLocationReconciled = useRef(false);
  const pendingLocationRecovery = useRef<WorkspaceState | null>(null);

  // Next.js can replace the browser URL while applying a server-action
  // revalidation even when the selected hierarchy item does not change. Run
  // after every shell render so mutations such as page saves reassert the
  // canonical, reloadable selection URL as well as explicit selections do.
  useEffect(() => {
    // A revalidation may remount the shell with an empty selection while the
    // browser still holds a deep link. Recover only from the authorized tree,
    // never from the URL alone or from another user's identifiers.
    if (!initialLocationReconciled.current) {
      initialLocationReconciled.current = true;
      const params = new URLSearchParams(window.location.search);
      const requestedState = resolveWorkspaceState(
        { grimoires: tree.grimoires },
        {
          grimoireId: params.get("grimoire"),
          notebookId: params.get("notebook"),
          chapterId: params.get("chapter"),
          pageId: params.get("page"),
        },
      );
      if (
        !state.grimoireId &&
        !state.notebookId &&
        !state.chapterId &&
        !state.pageId &&
        requestedState.grimoireId
      ) {
        pendingLocationRecovery.current = requestedState;
        queueMicrotask(() => setState(requestedState));
        return;
      }
    }
    if (pendingLocationRecovery.current) {
      const restored = pendingLocationRecovery.current;
      if (
        state.grimoireId !== restored.grimoireId ||
        state.notebookId !== restored.notebookId ||
        state.chapterId !== restored.chapterId ||
        state.pageId !== restored.pageId
      ) return;
      pendingLocationRecovery.current = null;
    }
    const canonicalHref = getWorkspaceCanonicalHref(state);
    const currentHref =
      window.location.pathname + window.location.search + window.location.hash;

    if (currentHref !== canonicalHref) {
      window.history.replaceState(window.history.state, "", canonicalHref);
    }
  });
  const [pages, setPages] = useState<Record<string, Page>>({});
  const [pageProgress, setPageProgress] = useState<Record<string, PageProgressStatus>>(initialPageProgress);
  const [renamedGrimoires, setRenamedGrimoires] = useState<Record<string, string>>({});
  const [renamedNotebooks, setRenamedNotebooks] = useState<Record<string, string>>({});
  const [renamedChapters, setRenamedChapters] = useState<Record<string, string>>({});
  const [createdGrimoires, setCreatedGrimoires] = useState<
    Array<Grimoire & {
      notebooks: Array<
        Notebook & { chapters: Array<Chapter & { pages: Page[] }> }
      >;
    }>
  >([]);
  const [createdNotebooks, setCreatedNotebooks] = useState<
    Record<string, Array<Notebook & { chapters: Array<Chapter & { pages: Page[] }> }>>
  >({});
  const [createdChapters, setCreatedChapters] = useState<
    Record<string, Array<Chapter & { pages: Page[] }>>
  >({});
  const [createdPages, setCreatedPages] = useState<Record<string, Page[]>>({});
  const [reorderedPages, setReorderedPages] = useState<Record<string, number>>({});
  const [deletedPageIds, setDeletedPageIds] = useState<string[]>([]);
  const [deletionFeedback, setDeletionFeedback] = useState("");
  const restoreFocusAfterDelete = useRef(false);
  const [navigationNotice, setNavigationNotice] = useState("");
  const ownerId = tree.grimoires[0]?.ownerId ?? createdGrimoires[0]?.ownerId ?? null;
  const latestOwnerRef = useRef(ownerId);
  useEffect(() => {
    if (!sameWorkspaceSelection(latestSelectionRef.current, state)) {
      selectionEpochRef.current += 1;
    }
    latestSelectionRef.current = state;
    latestOwnerRef.current = ownerId;
  }, [ownerId, state]);
  const activeDraft = useSyncExternalStore(
    subscribeDrafts,
    () => readDraft(ownerId, state.pageId),
    emptyDraftSnapshot,
  );
  const onDraftStateChange = useCallback((snapshot: WorkspaceDraftState) => {
    if (ownerId) publishTransientDraft(ownerId, snapshot);
  }, [ownerId]);

  /** A cancelled transition must leave the draft untouched. */
  const mayLeave = useCallback(() => {
    const pending = readDraft(ownerId, state.pageId);
    if (!pending?.dirty && !pending?.saving) return true;
    if (pending.saving) {
      setNavigationNotice("Aguarde o salvamento terminar antes de sair desta página.");
      return false;
    }
    setNavigationNotice("");
    return window.confirm("Há alterações não salvas nesta página. Sair e descartar o rascunho?");
  }, [ownerId, state.pageId]);

  const captureCreationOrigin = (): CreationOrigin => ({
    selection: { ...state },
    selectionEpoch: selectionEpochRef.current,
    ownerId,
    draft: readDraft(ownerId, state.pageId),
  });

  /** Keep an existing selection and draft if anything changes while creation is pending. */
  const selectAfterCreation = (
    origin: CreationOrigin,
    choose: (current: WorkspaceState) => WorkspaceState,
  ) => {
    if (selectionEpochRef.current !== origin.selectionEpoch ||
        !sameWorkspaceSelection(latestSelectionRef.current, origin.selection) ||
        latestOwnerRef.current !== origin.ownerId ||
        readDraft(origin.ownerId, origin.selection.pageId) !== origin.draft) {
      setNavigationNotice(
        "Item criado. Sua seleção e alterações recentes foram preservadas. Salve a página antes de abrir o novo item.",
      );
      return;
    }
    const next = choose(latestSelectionRef.current);
    discardTransientDraft(origin.ownerId, origin.selection.pageId);
    if (!sameWorkspaceSelection(latestSelectionRef.current, next)) {
      selectionEpochRef.current += 1;
    }
    latestSelectionRef.current = next;
    setState(next);
    setNavigationNotice("");
  };

  const leaveSelection = (next: WorkspaceState) => {
    if (!mayLeave()) return;
    discardTransientDraft(ownerId, state.pageId);
    if (!sameWorkspaceSelection(latestSelectionRef.current, next)) {
      selectionEpochRef.current += 1;
    }
    latestSelectionRef.current = next;
    setState(next);
  };

  /** Guard controlled links, forms and unload. Browser history traversal remains unguarded. */
  useEffect(() => {
    const pending = () => readDraft(ownerId, state.pageId);
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!pending()?.dirty && !pending()?.saving) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const followLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 ||
          event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const element = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(element instanceof HTMLAnchorElement) ||
          element.hasAttribute("download") || element.target === "_blank") return;
      const destination = new URL(element.href, window.location.href);
      if (destination.origin === window.location.origin &&
          destination.pathname === window.location.pathname &&
          destination.search === window.location.search) return;
      if (!pending()?.dirty && !pending()?.saving) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!mayLeave()) return;
      discardTransientDraft(ownerId, state.pageId);
      window.location.assign(destination.href);
    };
    const submitForm = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.closest(".workspace-shell")) return;
      if (!pending()?.dirty && !pending()?.saving) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!mayLeave()) return;
      discardTransientDraft(ownerId, state.pageId);
      form.requestSubmit(event.submitter instanceof HTMLElement ? event.submitter : undefined);
    };
    const pageHide = () => { transientDrafts?.clear(); };
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("pagehide", pageHide);
    document.addEventListener("click", followLink, true);
    document.addEventListener("submit", submitForm, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("pagehide", pageHide);
      document.removeEventListener("click", followLink, true);
      document.removeEventListener("submit", submitForm, true);
    };
  }, [mayLeave, ownerId, state.pageId]);

  // The keyed PageEditor unmounts after successful deletion. Return focus
  // to the surviving editor region, never to a now-detached delete button.
  useEffect(() => {
    if (!restoreFocusAfterDelete.current) return;
    restoreFocusAfterDelete.current = false;
    if (!state.pageId) document.getElementById("current")?.focus();
  }, [state.pageId, deletedPageIds]);

  const workspaceTree = useMemo<WorkspaceTree>(() => ({
    grimoires: mergePersistedAndCreated(tree.grimoires, createdGrimoires).map((grimoire) => ({
      ...grimoire,
      title: renamedGrimoires[grimoire.id] ?? grimoire.title,
      notebooks: mergePersistedAndCreated(
        grimoire.notebooks ?? [],
        createdNotebooks[grimoire.id] ?? [],
      )
        .sort((left, right) => left.position - right.position)
        .map((notebook) => ({
        ...notebook,
        title: renamedNotebooks[notebook.id] ?? notebook.title,
        chapters: mergePersistedAndCreated(
          notebook.chapters ?? [],
          createdChapters[notebook.id] ?? [],
        )
          .sort((left, right) => left.position - right.position)
          .map((chapter) => ({
          ...chapter,
          title: renamedChapters[chapter.id] ?? chapter.title,
          pages: mergePersistedAndCreated(
            chapter.pages ?? [],
            createdPages[chapter.id] ?? [],
          )
            .map((page) => pages[page.id] ?? page)
            .filter((page) => !deletedPageIds.includes(page.id))
            .sort(
              (left, right) =>
                (reorderedPages[left.id] ?? left.position) -
                  (reorderedPages[right.id] ?? right.position) ||
                left.id.localeCompare(right.id),
            ),
        })),
    })),
  })),
  }), [
    createdChapters,
    createdGrimoires,
    renamedChapters,
    renamedGrimoires,
    renamedNotebooks,
    createdNotebooks,
    createdPages,
    deletedPageIds,
    pages,
    reorderedPages,
    tree,
  ]);

  const selectedPage = useMemo(() => {
    const persistedPage = findSelectedPage(workspaceTree, state);
    if (!persistedPage) return null;

    return pages[persistedPage.id] ?? persistedPage;
  }, [pages, state, workspaceTree]);

  const title = useMemo(
    () => (selectedPage ? selectedPage.title : findWorkspaceTitle(workspaceTree, state)),
    [selectedPage, state, workspaceTree],
  );

  const pageMovement = useMemo(() => {
    if (!selectedPage || !state.chapterId) {
      return { canMoveUp: false, canMoveDown: false };
    }

    const chapter = workspaceTree.grimoires
      .flatMap((grimoire) => grimoire.notebooks ?? [])
      .flatMap((notebook) => notebook.chapters ?? [])
      .find((item) => item.id === state.chapterId);

    const pagesInChapter = [...(chapter?.pages ?? [])].sort(
      (left, right) =>
        (reorderedPages[left.id] ?? left.position) -
          (reorderedPages[right.id] ?? right.position) ||
        left.id.localeCompare(right.id),
    );
    const index = pagesInChapter.findIndex(
      (page) => page.id === selectedPage.id,
    );

    return {
      canMoveUp: index > 0,
      canMoveDown: index >= 0 && index < pagesInChapter.length - 1,
    };
  }, [reorderedPages, selectedPage, state.chapterId, workspaceTree]);

  /** Rename a grimoire and reflect the persisted title locally. */
  const renameGrimoire = async (input: { id: string; title: string }) => {
    const updated = await onRenameGrimoire(input);
    setRenamedGrimoires((current) => ({
      ...current,
      [updated.id]: updated.title,
    }));
    return updated;
  };

  /** Rename a notebook and reflect the persisted title locally. */
  const renameNotebook = async (input: { id: string; title: string }) => {
    const updated = await onRenameNotebook(input);
    setRenamedNotebooks((current) => ({
      ...current,
      [updated.id]: updated.title,
    }));
    return updated;
  };

  /** Rename a chapter and reflect the persisted title locally. */
  const renameChapter = async (input: { id: string; title: string }) => {
    const updated = await onRenameChapter(input);
    setRenamedChapters((current) => ({
      ...current,
      [updated.id]: updated.title,
    }));
    return updated;
  };

  /** Create a grimoire, add it to the local tree, and select it. */
  const createGrimoire = async (input: { title: string }) => {
    if (!mayLeave()) throw new Error("Navegação cancelada para preservar o rascunho.");
    const origin = captureCreationOrigin();
    const created = await onCreateGrimoire(input);
    const grimoire = {
      ...created,
      notebooks: [] as Array<
        Notebook & { chapters: Array<Chapter & { pages: Page[] }> }
      >,
    };
    setCreatedGrimoires((current) => [...current, grimoire]);
    selectAfterCreation(origin, (current) => openGrimoire(current, created.id));
    return created;
  };

  /** Create a notebook, add it to the local tree, and select it. */
  const createNotebook = async (input: { grimoireId: string; title: string }) => {
    if (!mayLeave()) throw new Error("Navegação cancelada para preservar o rascunho.");
    const origin = captureCreationOrigin();
    const created = await onCreateNotebook(input);
    const notebook = {
      ...created,
      chapters: [] as Array<Chapter & { pages: Page[] }>,
    };
    setCreatedNotebooks((current) => ({
      ...current,
      [created.grimoireId]: [
        ...(current[created.grimoireId] ?? []),
        notebook,
      ],
    }));
    selectAfterCreation(origin, (current) =>
      openNotebook({ ...current, grimoireId: created.grimoireId }, created.id),
    );
    return created;
  };

  /** Create a chapter, add it to the local tree, and select it. */
  const createChapter = async (input: { notebookId: string; title: string }) => {
    if (!mayLeave()) throw new Error("Navegação cancelada para preservar o rascunho.");
    const origin = captureCreationOrigin();
    const created = await onCreateChapter(input);
    const chapter = { ...created, pages: [] as Page[] };
    setCreatedChapters((current) => ({
      ...current,
      [created.notebookId]: [...(current[created.notebookId] ?? []), chapter],
    }));
    selectAfterCreation(origin, (current) =>
      openChapter({
        ...current,
        notebookId: created.notebookId,
        chapterId: created.id,
        pageId: null,
      }, created.id),
    );
    return created;
  };

  /** Create a page, add it to the local tree, and select it for editing. */
  const createPage = async (input: { chapterId: string; title: string }) => {
    if (!mayLeave()) throw new Error("Navegação cancelada para preservar o rascunho.");
    const origin = captureCreationOrigin();
    const created = await onCreatePage(input);
    setCreatedPages((current) => ({
      ...current,
      [created.chapterId]: [...(current[created.chapterId] ?? []), created],
    }));
    setPages((current) => ({ ...current, [created.id]: created }));
    selectAfterCreation(origin, (current) =>
      openPage({ ...current, chapterId: created.chapterId }, created.id),
    );
    return created;
  };

  /** Move the selected page one position and update both affected local positions. */
  const movePage = async (direction: "up" | "down") => {
    if (!selectedPage) return;

    const result = await onMovePage({
      id: selectedPage.id,
      direction,
    });

    setReorderedPages((current) => ({
      ...current,
      [result.movedPage.id]: result.movedPage.position,
      ...(result.swappedPage
        ? { [result.swappedPage.id]: result.swappedPage.position }
        : {}),
    }));

  };

  /** Adapt page movement to the Workspace editor callback contract. */
  const handleMovePage = movePage;

  /** Delete a page, clear its local state, and keep the chapter selected. */
  const deletePage = async (id: string) => {
    if (!mayLeave()) throw new Error("Exclusão cancelada para preservar o rascunho.");
    await onDeletePage(id);
    discardTransientDraft(ownerId, state.pageId);
    restoreFocusAfterDelete.current = state.pageId === id;
    setDeletionFeedback("Página excluída. Retorno ao capítulo.");
    setDeletedPageIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
    setPages((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([pageId]) => pageId !== id),
      ),
    );
    setCreatedPages((current) =>
      Object.fromEntries(
        Object.entries(current).map(([chapterId, chapterPages]) => [
          chapterId,
          chapterPages.filter((page) => page.id !== id),
        ]),
      ),
    );
    setState((current) =>
      current.pageId === id
        ? { ...current, pageId: null }
        : current,
    );
  };

  /** Persist the selected page progress and reflect it locally. */
  const setSelectedPageProgress = async (status: PageProgressStatus) => {
    if (!selectedPage) return;

    await onSetPageProgress({ pageId: selectedPage.id, status });
    setPageProgress((current) => ({ ...current, [selectedPage.id]: status }));
  };

  /** Persist a page and immediately reflect the returned version in the shell. */
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
      tree={workspaceTree}
      state={state}
      title={title}
      selectedPage={selectedPage}
      deletionFeedback={deletionFeedback}
      navigationNotice={navigationNotice}
      draftSnapshot={activeDraft}
      onDraftStateChange={onDraftStateChange}
      canMovePageUp={pageMovement.canMoveUp}
      canMovePageDown={pageMovement.canMoveDown}
      onOpenGrimoire={(id) => leaveSelection(openGrimoire(state, id))}
      onCreateGrimoire={createGrimoire}
      onRenameGrimoire={renameGrimoire}
      onRenameNotebook={renameNotebook}
      onRenameChapter={renameChapter}
      onOpenNotebook={(id) => leaveSelection(openNotebook(state, id))}
      onOpenChapter={(id) => {
        setDeletionFeedback("");
        leaveSelection(openChapter(state, id));
      }}
      onOpenPage={(id) => {
        setDeletionFeedback("");
        leaveSelection(openPage(state, id));
      }}
      onCreateNotebook={createNotebook}
      onCreateChapter={createChapter}
      onCreatePage={createPage}
      onMovePage={handleMovePage}
      onDeletePage={deletePage}
      onSavePage={savePage}
      pageProgressStatus={selectedPage ? pageProgress[selectedPage.id] ?? "not-started" : "not-started"}
      onSetPageProgress={setSelectedPageProgress}
    />
  );
}
