"use client";

import { useState } from "react";
import type { Page, WorkspaceState } from "@/domains/learning";
import { PageEditor } from "./PageEditor";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { WorkspaceTree } from "./WorkspaceTree";

type WorkspaceProps = {
  tree: Parameters<typeof WorkspaceTree>[0]["data"];
  state: WorkspaceState;
  title: string;
  selectedPage: Page | null;
  onOpenGrimoire: (id: string) => void;
  onOpenNotebook: (id: string) => void;
  onOpenChapter: (id: string) => void;
  onOpenPage: (id: string) => void;
  onCreatePage: (input: { chapterId: string; title: string }) => Promise<Page>;
  onSavePage: (input: {
    id: string;
    title: string;
    content: Page["content"];
  }) => Promise<Page>;
};

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
  onCreatePage,
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
