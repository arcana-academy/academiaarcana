"use client";

import type { WorkspaceState } from "@/domains/learning";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { WorkspaceTree } from "./WorkspaceTree";

type WorkspaceProps = {
  tree: Parameters<typeof WorkspaceTree>[0]["data"];
  state: WorkspaceState;
  title: string;
  onOpenGrimoire: (id: string) => void;
  onOpenNotebook: (id: string) => void;
  onOpenChapter: (id: string) => void;
  onOpenPage: (id: string) => void;
};

export function Workspace({
  tree,
  state,
  title,
  onOpenGrimoire,
  onOpenNotebook,
  onOpenChapter,
  onOpenPage,
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
          <p>Selecione uma página para começar.</p>
        </main>
        <aside aria-label="Contexto">
          <p>Contexto do item selecionado.</p>
        </aside>
      </div>
    </section>
  );
}
