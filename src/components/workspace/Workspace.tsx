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
  const [newPageTitle, setNewPageTitle] = useState("");
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const createPage = async () => {
    if (!state.chapterId) return;

    setIsCreatingPage(true);
    setCreateError(null);

    try {
      await onCreatePage({
        chapterId: state.chapterId,
        title: newPageTitle,
      });
      setNewPageTitle("");
    } catch {
      setCreateError("Não foi possível criar a página.");
    } finally {
      setIsCreatingPage(false);
    }
  };

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
            <form
              aria-label="Criar página"
              onSubmit={(event) => {
                event.preventDefault();
                void createPage();
              }}
            >
              <label htmlFor="workspace-new-page-title">
                Nova página
              </label>
              <input
                id="workspace-new-page-title"
                value={newPageTitle}
                onChange={(event) => setNewPageTitle(event.target.value)}
                disabled={isCreatingPage}
                placeholder="Título da página"
              />
              <button
                type="submit"
                disabled={isCreatingPage || !newPageTitle.trim()}
              >
                {isCreatingPage ? "Criando…" : "Criar página"}
              </button>
              {createError ? (
                <p role="alert">{createError}</p>
              ) : null}
            </form>
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
