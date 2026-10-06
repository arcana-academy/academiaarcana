"use client";

import { useState } from "react";
import type { Chapter, Grimoire, Notebook, Page, PageProgressStatus, WorkspaceState } from "@/domains/learning";
import { PageEditor } from "./PageEditor";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { WorkspaceTree } from "./WorkspaceTree";
import { WorkspaceTitleEditor } from "./WorkspaceTitleEditor";
import { useMobileDisclosure } from "./useMobileDisclosure";

type WorkspaceProps = {
  tree: Parameters<typeof WorkspaceTree>[0]["data"];
  state: WorkspaceState;
  title: string;
  selectedPage: Page | null;
  onOpenGrimoire: (id: string) => void;
  onOpenNotebook: (id: string) => void;
  onOpenChapter: (id: string) => void;
  onOpenPage: (id: string) => void;
  onCreateGrimoire: (input: { title: string }) => Promise<Grimoire>;
  onRenameGrimoire: (input: { id: string; title: string }) => Promise<Grimoire>;
  onRenameNotebook: (input: { id: string; title: string }) => Promise<Notebook>;
  onRenameChapter: (input: { id: string; title: string }) => Promise<Chapter>;
  onCreateNotebook: (input: { grimoireId: string; title: string }) => Promise<Notebook>;
  onCreateChapter: (input: { notebookId: string; title: string }) => Promise<Chapter>;
  onCreatePage: (input: { chapterId: string; title: string }) => Promise<Page>;
  canMovePageUp: boolean;
  canMovePageDown: boolean;
  onMovePage: (direction: "up" | "down") => Promise<void>;
  onDeletePage: (id: string) => Promise<void>;
  onSavePage: (input: {
    id: string;
    title: string;
    content: Page["content"];
  }) => Promise<Page>;
  pageProgressStatus?: PageProgressStatus;
  onSetPageProgress?: (status: PageProgressStatus) => Promise<void>;
};

type GrimoireCreationFormProps = {
  onCreateGrimoire: (input: { title: string }) => Promise<Grimoire>;
};

/** Provide the controls and feedback for creating a grimoire. */
function GrimoireCreationForm({ onCreateGrimoire }: GrimoireCreationFormProps) {
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Submit a grimoire creation request and reset the form after success. */
  const handleCreate = async () => {
    if (!title.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      await onCreateGrimoire({ title });
      setTitle("");
    } catch {
      setError("Não foi possível criar o grimório.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form
      className="workspace-create-form"
      aria-label="Criar grimório"
      onSubmit={(event) => {
        event.preventDefault();
        void handleCreate();
      }}
    >
      <label htmlFor="workspace-new-grimoire-title">Novo grimório</label>
      <input
        className="aa-input"
        id="workspace-new-grimoire-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        disabled={isCreating}
        placeholder="Título do grimório"
      />
      <button
        className="aa-button aa-button-secondary"
        type="submit"
        disabled={isCreating || !title.trim()}
      >
        {isCreating ? "Criando…" : "Criar grimório"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}

type NotebookCreationFormProps = {
  grimoireId: string;
  onCreateNotebook: (input: { grimoireId: string; title: string }) => Promise<Notebook>;
};

/** Provide the controls and feedback for creating a notebook in a grimoire. */
function NotebookCreationForm({
  grimoireId,
  onCreateNotebook,
}: NotebookCreationFormProps) {
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Submit a notebook creation request and reset the form after success. */
  const handleCreate = async () => {
    if (!title.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      await onCreateNotebook({ grimoireId, title });
      setTitle("");
    } catch {
      setError("Não foi possível criar o caderno.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form
      className="workspace-create-form"
      aria-label="Criar caderno"
      onSubmit={(event) => {
        event.preventDefault();
        void handleCreate();
      }}
    >
      <label htmlFor="workspace-new-notebook-title">Novo caderno</label>
      <input
        className="aa-input"
        id="workspace-new-notebook-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        disabled={isCreating}
        placeholder="Título do caderno"
      />
      <button
        className="aa-button aa-button-secondary"
        type="submit"
        disabled={isCreating || !title.trim()}
      >
        {isCreating ? "Criando…" : "Criar caderno"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}

type ChapterCreationFormProps = {
  notebookId: string;
  onCreateChapter: (input: { notebookId: string; title: string }) => Promise<Chapter>;
};

/** Provide the controls and feedback for creating a chapter in a notebook. */
function ChapterCreationForm({
  notebookId,
  onCreateChapter,
}: ChapterCreationFormProps) {
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Submit a chapter creation request and reset the form after success. */
  const handleCreate = async () => {
    if (!title.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      await onCreateChapter({ notebookId, title });
      setTitle("");
    } catch {
      setError("Não foi possível criar o capítulo.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form
      className="workspace-create-form"
      aria-label="Criar capítulo"
      onSubmit={(event) => {
        event.preventDefault();
        void handleCreate();
      }}
    >
      <label htmlFor="workspace-new-chapter-title">Novo capítulo</label>
      <input
        className="aa-input"
        id="workspace-new-chapter-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        disabled={isCreating}
        placeholder="Título do capítulo"
      />
      <button
        className="aa-button aa-button-secondary"
        type="submit"
        disabled={isCreating || !title.trim()}
      >
        {isCreating ? "Criando…" : "Criar capítulo"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}

type PageCreationFormProps = {
  chapterId: string;
  onCreatePage: (input: { chapterId: string; title: string }) => Promise<Page>;
};

/** Provide the controls and feedback for creating a page in a chapter. */
function PageCreationForm({
  chapterId,
  onCreatePage,
}: PageCreationFormProps) {
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Submit a page creation request and reset the form after success. */
  const handleCreate = async () => {
    if (!title.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      await onCreatePage({
        chapterId,
        title,
      });
      setTitle("");
    } catch {
      setError("Não foi possível criar a página.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form
      className="workspace-create-form"
      aria-label="Criar página"
      onSubmit={(event) => {
        event.preventDefault();
        void handleCreate();
      }}
    >
      <label htmlFor="workspace-new-page-title">
        Nova página
      </label>
      <input
        className="aa-input"
        id="workspace-new-page-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        disabled={isCreating}
        placeholder="Título da página"
      />
      <button
        className="aa-button aa-button-secondary"
        type="submit"
        disabled={isCreating || !title.trim()}
      >
        {isCreating ? "Criando…" : "Criar página"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}

/** Render the Workspace tree, creation controls, and selected page editor. */
export function Workspace({
  tree,
  state,
  title,
  selectedPage,
  onOpenGrimoire,
  onOpenNotebook,
  onOpenChapter,
  onOpenPage,
  onCreateGrimoire,
  onRenameGrimoire,
  onRenameNotebook,
  onRenameChapter,
  onCreateNotebook,
  onCreateChapter,
  onCreatePage,
  canMovePageUp,
  canMovePageDown,
  onMovePage,
  onDeletePage,
  onSavePage,
  pageProgressStatus = "not-started",
  onSetPageProgress = async () => undefined,
}: WorkspaceProps) {
  const [isContextExpanded, setIsContextExpanded] = useMobileDisclosure();

  const focusGrimoireCreation = () => {
    document.getElementById("workspace-new-grimoire-title")?.focus();
  };

  return (
    <div className="workspace-shell">
      <WorkspaceHeader title={title} />

      <div className="workspace-regions">
        <WorkspaceTree
          data={tree}
          state={state}
          onOpenGrimoire={onOpenGrimoire}
          onOpenNotebook={onOpenNotebook}
          onOpenChapter={onOpenChapter}
          onOpenPage={onOpenPage}
        />

        <section
          className="workspace-editor-region"
          aria-labelledby="workspace-editor-heading"
        >
          <div className="workspace-region-heading">
            <span className="workspace-region-kicker">Editor</span>
            <h2 id="workspace-editor-heading">Área de trabalho</h2>
          </div>

          <div className="workspace-create-panel">
            <GrimoireCreationForm onCreateGrimoire={onCreateGrimoire} />
          </div>

          {state.grimoireId && !state.notebookId && !state.chapterId ? (
            <WorkspaceTitleEditor
              key={`grimoire-${state.grimoireId}`}
              title={title}
              itemLabel="grimório"
              onSave={async (nextTitle) => {
                await onRenameGrimoire({
                  id: state.grimoireId!,
                  title: nextTitle,
                });
              }}
            />
          ) : null}

          {state.notebookId && !state.chapterId ? (
            <WorkspaceTitleEditor
              key={`notebook-${state.notebookId}`}
              title={title}
              itemLabel="caderno"
              onSave={async (nextTitle) => {
                await onRenameNotebook({
                  id: state.notebookId!,
                  title: nextTitle,
                });
              }}
            />
          ) : null}

          {state.chapterId && !state.pageId ? (
            <WorkspaceTitleEditor
              key={`chapter-${state.chapterId}`}
              title={title}
              itemLabel="capítulo"
              onSave={async (nextTitle) => {
                await onRenameChapter({
                  id: state.chapterId!,
                  title: nextTitle,
                });
              }}
            />
          ) : null}

          {state.grimoireId && !state.notebookId ? (
            <NotebookCreationForm
              grimoireId={state.grimoireId}
              onCreateNotebook={onCreateNotebook}
            />
          ) : null}

          {state.notebookId && !state.chapterId ? (
            <ChapterCreationForm
              notebookId={state.notebookId}
              onCreateChapter={onCreateChapter}
            />
          ) : null}

          {state.chapterId ? (
            <PageCreationForm
              chapterId={state.chapterId}
              onCreatePage={onCreatePage}
            />
          ) : null}

          {selectedPage ? (
            <div className="workspace-page-editor">
              <PageEditor
                key={selectedPage.id}
                page={selectedPage}
                canMoveUp={canMovePageUp}
                canMoveDown={canMovePageDown}
                onMove={onMovePage}
                onDelete={onDeletePage}
                onSave={onSavePage}
                progressStatus={pageProgressStatus}
                onSetProgress={onSetPageProgress}
              />
            </div>
          ) : (
            <div className="workspace-empty-state" role="status">
              <strong>
                {tree.grimoires.length === 0
                  ? "Seu Workspace ainda não tem grimórios."
                  : "Selecione uma página para começar."}
              </strong>
              <p>
                {tree.grimoires.length === 0
                  ? "Crie seu primeiro grimório aqui ou explore a biblioteca para continuar sua jornada."
                  : "Use a árvore de estudos para abrir uma página ou explore seus grimórios."}
              </p>
              <div className="workspace-empty-actions">
                {tree.grimoires.length === 0 ? (
                  <button
                    className="aa-button aa-button-primary"
                    type="button"
                    onClick={focusGrimoireCreation}
                  >
                    Criar um grimório
                  </button>
                ) : null}
                <a className="aa-button aa-button-secondary" href="/grimorios">
                  Explorar Grimórios
                </a>
              </div>
            </div>
          )}
        </section>

        <aside
          className="workspace-context-region"
          aria-labelledby="workspace-context-heading"
        >
          <details
            className="workspace-region-disclosure"
            open={isContextExpanded}
            onToggle={(event) => setIsContextExpanded(event.currentTarget.open)}
          >
            <summary className="workspace-region-heading workspace-panel-summary">
              <span className="workspace-region-kicker">Estudo</span>
              <h2 id="workspace-context-heading">Contexto</h2>
            </summary>

            <div className="workspace-panel-disclosure-content">
              {selectedPage ? (
                <div className="workspace-context-card">
                  <span>Página selecionada</span>
                  <strong>{selectedPage.title}</strong>
                  <p>
                    O contexto acompanha a página atual sem competir com a área de
                    edição.
                  </p>
                </div>
              ) : (
                <p className="workspace-context-empty">
                  Selecione uma página na árvore para ver o contexto do estudo.
                </p>
              )}
            </div>
          </details>
        </aside>
      </div>
    </div>
  );
}
