"use client";

import { useState } from "react";
import type { Chapter, Grimoire, Notebook, Page, WorkspaceState } from "@/domains/learning";
import { PageEditor } from "./PageEditor";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { WorkspaceTree } from "./WorkspaceTree";
import { WorkspaceTitleEditor } from "./WorkspaceTitleEditor";

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
  onDeletePage: (id: string) => Promise<void>;
  onSavePage: (input: {
    id: string;
    title: string;
    content: Page["content"];
  }) => Promise<Page>;
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
      aria-label="Criar grimório"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <label htmlFor="workspace-new-grimoire-title">Novo grimório</label>
      <input
        id="workspace-new-grimoire-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        disabled={isCreating}
        placeholder="Título do grimório"
      />
      <button
        type="button"
        disabled={isCreating || !title.trim()}
        onClick={handleCreate}
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
      aria-label="Criar caderno"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <label htmlFor="workspace-new-notebook-title">Novo caderno</label>
      <input
        id="workspace-new-notebook-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        disabled={isCreating}
        placeholder="Título do caderno"
      />
      <button
        type="button"
        disabled={isCreating || !title.trim()}
        onClick={handleCreate}
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
    <form aria-label="Criar capítulo" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="workspace-new-chapter-title">Novo capítulo</label>
      <input
        id="workspace-new-chapter-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        disabled={isCreating}
        placeholder="Título do capítulo"
      />
      <button
        type="button"
        disabled={isCreating || !title.trim()}
        onClick={handleCreate}
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
      aria-label="Criar página"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <label htmlFor="workspace-new-page-title">
        Nova página
      </label>
      <input
        id="workspace-new-page-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        disabled={isCreating}
        placeholder="Título da página"
      />
      <button
        type="button"
        disabled={isCreating || !title.trim()}
        onClick={handleCreate}
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
  onDeletePage,
  onSavePage,
}: WorkspaceProps) {
  return (
    <section aria-label="Workspace" className="workspace-shell">
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
        <main aria-label="Área de trabalho">
          <GrimoireCreationForm onCreateGrimoire={onCreateGrimoire} />

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
            <PageEditor
              key={selectedPage.id}
              page={selectedPage}
              onDelete={onDeletePage}
              onSave={onSavePage}
            />
          ) : (
            <p>Selecione uma página para começar.</p>
          )}
        </main>
        <aside aria-label="Contexto">
          {selectedPage ? (
            <p>Página selecionada: {selectedPage.title}</p>
          ) : (
            <p>Contexto do item selecionado.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
