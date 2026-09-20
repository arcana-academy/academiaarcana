"use client";

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
  onSavePage: (input: {
    id: string;
    title: string;
    content: Page["content"];
  }) => Promise<Page>;
};

export function Workspace({
  tree,
  state,
  title,
  selectedPage,
  onOpenGrimoire,
  onOpenNotebook,
  onOpenChapter,
  onOpenPage,
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
