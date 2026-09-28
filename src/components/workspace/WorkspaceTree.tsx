"use client";

import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
} from "lucide-react";
import { useState } from "react";

import type {
  Chapter,
  Grimoire,
  Notebook,
  Page,
  WorkspaceState,
} from "@/domains/learning";

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

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  return (
    <nav className="workspace-tree" aria-label="Navegação do workspace">
      <div className="workspace-tree-heading">
        <span className="aa-eyebrow">Biblioteca</span>
        <span className="workspace-tree-count">
          {data.grimoires.length}{" "}
          {data.grimoires.length === 1 ? "grimório" : "grimórios"}
        </span>
      </div>

      {data.grimoires.length === 0 ? (
        <p className="aa-empty-state" role="status">
          Nenhum grimório encontrado
        </p>
      ) : (
        <div className="workspace-tree-list">
          {data.grimoires.map((grimoire) => {
            const collapsed = collapsedGrimoires.has(grimoire.id);
            const grimoireSelected = state.grimoireId === grimoire.id;

            return (
              <div className="workspace-tree-node" key={grimoire.id}>
                <div className="workspace-tree-row">
                  <button
                    className="workspace-tree-item"
                    type="button"
                    aria-current={grimoireSelected ? "page" : undefined}
                    onClick={() => onOpenGrimoire(grimoire.id)}
                  >
                    <BookOpen aria-hidden="true" size={17} strokeWidth={1.8} />
                    <span>{grimoire.title}</span>
                  </button>

                  <button
                    className="workspace-tree-toggle"
                    type="button"
                    aria-label={
                      (collapsed ? "Expandir " : "Recolher ") + grimoire.title
                    }
                    aria-expanded={!collapsed}
                    onClick={() => toggleGrimoire(grimoire.id)}
                  >
                    {collapsed ? (
                      <ChevronRight aria-hidden="true" size={17} strokeWidth={1.9} />
                    ) : (
                      <ChevronDown aria-hidden="true" size={17} strokeWidth={1.9} />
                    )}
                  </button>
                </div>

                {!collapsed ? (
                  <div className="workspace-tree-children workspace-tree-level-2">
                    {grimoire.notebooks?.map((notebook) => (
                      <div className="workspace-tree-node" key={notebook.id}>
                        <button
                          className="workspace-tree-item"
                          type="button"
                          aria-current={
                            state.notebookId === notebook.id ? "page" : undefined
                          }
                          onClick={() => onOpenNotebook(notebook.id)}
                        >
                          <FileText aria-hidden="true" size={16} strokeWidth={1.7} />
                          <span>{notebook.title}</span>
                        </button>

                        <div className="workspace-tree-children workspace-tree-level-3">
                          {notebook.chapters?.map((chapter) => (
                            <div className="workspace-tree-node" key={chapter.id}>
                              <button
                                className="workspace-tree-item"
                                type="button"
                                aria-current={
                                  state.chapterId === chapter.id
                                    ? "page"
                                    : undefined
                                }
                                onClick={() => onOpenChapter(chapter.id)}
                              >
                                <FileText
                                  aria-hidden="true"
                                  size={15}
                                  strokeWidth={1.7}
                                />
                                <span>{chapter.title}</span>
                              </button>

                              <div className="workspace-tree-children workspace-tree-level-4">
                                {chapter.pages?.map((page) => (
                                  <button
                                    className="workspace-tree-item"
                                    key={page.id}
                                    type="button"
                                    tabIndex={0}
                                    aria-current={
                                      state.pageId === page.id
                                        ? "page"
                                        : undefined
                                    }
                                    onClick={() => onOpenPage(page.id)}
                                  >
                                    <span
                                      className="workspace-tree-page-marker"
                                      aria-hidden="true"
                                    />
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
          })}
        </div>
      )}
    </nav>
  );
}
