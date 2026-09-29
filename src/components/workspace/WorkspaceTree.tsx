"use client";

import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
} from "lucide-react";
import type { Chapter, Grimoire, Notebook, Page, WorkspaceState } from "@/domains/learning";

type WorkspaceTreeData = {
  grimoires: Array<
    Grimoire & {
      notebooks?: Array<
        Notebook & {
          chapters?: Array<
            Chapter & {
              pages?: Page[];
            }
          >;
        }
      >;
    }
  >;
};

type WorkspaceTreeProps = {
  data: WorkspaceTreeData;
  state: WorkspaceState;
  onOpenGrimoire: (id: string) => void;
  onOpenNotebook: (id: string) => void;
  onOpenChapter: (id: string) => void;
  onOpenPage: (id: string) => void;
};

export function WorkspaceTree({
  data,
  state,
  onOpenGrimoire,
  onOpenNotebook,
  onOpenChapter,
  onOpenPage,
}: WorkspaceTreeProps) {
  const [collapsedGrimoires, setCollapsedGrimoires] = useState<Set<string>>(
    new Set(),
  );

  const toggleGrimoire = (id: string) => {
    setCollapsedGrimoires((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <nav className="workspace-tree" aria-label="Navegação do workspace">
      {data.grimoires.length === 0 ? (
        <div className="workspace-tree-empty" role="status">
          <BookOpen size={20} aria-hidden="true" />
          <p>Nenhum grimório encontrado</p>
        </div>
      ) : (
        data.grimoires.map((grimoire) => {
          const collapsed = collapsedGrimoires.has(grimoire.id);

          return (
            <div className="workspace-tree-group" key={grimoire.id}>
              <div className="workspace-tree-row workspace-tree-row-root">
                <button
                  className={[
                    "workspace-tree-item",
                    state.grimoireId === grimoire.id ? "is-current" : "",
                  ].filter(Boolean).join(" ")}
                  type="button"
                  aria-current={
                    state.grimoireId === grimoire.id ? "true" : undefined
                  }
                  onClick={() => onOpenGrimoire(grimoire.id)}
                >
                  <BookOpen size={17} aria-hidden="true" />
                  <span>{grimoire.title}</span>
                </button>

                <button
                  className="workspace-tree-toggle"
                  type="button"
                  aria-label={(collapsed ? "Expandir " : "Recolher ") + grimoire.title}
                  aria-expanded={!collapsed}
                  onClick={() => toggleGrimoire(grimoire.id)}
                >
                  {collapsed ? (
                    <ChevronRight size={17} aria-hidden="true" />
                  ) : (
                    <ChevronDown size={17} aria-hidden="true" />
                  )}
                </button>
              </div>

              {!collapsed ? (
                <div className="workspace-tree-children">
                  {grimoire.notebooks?.map((notebook) => (
                    <div className="workspace-tree-group" data-depth="1" key={notebook.id}>
                      <button
                        className={[
                          "workspace-tree-item",
                          state.notebookId === notebook.id ? "is-current" : "",
                        ].filter(Boolean).join(" ")}
                        type="button"
                        aria-current={
                          state.notebookId === notebook.id ? "true" : undefined
                        }
                        onClick={() => onOpenNotebook(notebook.id)}
                      >
                        <BookOpen size={16} aria-hidden="true" />
                        <span>{notebook.title}</span>
                      </button>

                      <div className="workspace-tree-children">
                        {notebook.chapters?.map((chapter) => (
                          <div className="workspace-tree-group" data-depth="2" key={chapter.id}>
                            <button
                              className={[
                                "workspace-tree-item",
                                state.chapterId === chapter.id ? "is-current" : "",
                              ].filter(Boolean).join(" ")}
                              type="button"
                              aria-current={
                                state.chapterId === chapter.id ? "true" : undefined
                              }
                              onClick={() => onOpenChapter(chapter.id)}
                            >
                              <BookOpen size={16} aria-hidden="true" />
                              <span>{chapter.title}</span>
                            </button>

                            <div className="workspace-tree-children">
                              {chapter.pages?.map((page) => (
                                <button
                                  className={[
                                    "workspace-tree-item workspace-tree-page",
                                    state.pageId === page.id ? "is-current" : "",
                                  ].filter(Boolean).join(" ")}
                                  key={page.id}
                                  type="button"
                                  tabIndex={0}
                                  aria-current={
                                    state.pageId === page.id ? "page" : undefined
                                  }
                                  onClick={() => onOpenPage(page.id)}
                                >
                                  <FileText size={15} aria-hidden="true" />
                                  <span>{page.title}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </nav>
  );
}
