"use client";

import { useState } from "react";
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

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  return (
    <nav className="workspace-tree-region" aria-label="Navegação do workspace">
      <div className="workspace-region-heading">
        <span className="workspace-region-kicker">Estrutura</span>
        <strong>Biblioteca de estudos</strong>
      </div>

      {data.grimoires.length === 0 ? (
        <div className="workspace-tree-empty" role="status">
          <p>Nenhum grimório encontrado</p>
          <span>
            Crie seu primeiro grimório na área de trabalho ou explore sua
            biblioteca.
          </span>
        </div>
      ) : (
        <ul className="workspace-tree-list workspace-tree-list--root">
          {data.grimoires.map((grimoire) => {
            const collapsed = collapsedGrimoires.has(grimoire.id);
            const grimoireOnPath = state.grimoireId === grimoire.id;
            const grimoireSelected = grimoireOnPath && !state.notebookId;

            return (
              <li className="workspace-tree-node" key={grimoire.id}>
                <div className="workspace-tree-row">
                  <button
                    className="workspace-tree-item workspace-tree-item--grimoire"
                    type="button"
                    data-active-path={grimoireOnPath ? "true" : undefined}
                    data-selected={grimoireSelected ? "true" : undefined}
                    aria-current={grimoireSelected ? "true" : undefined}
                    onClick={() => onOpenGrimoire(grimoire.id)}
                  >
                    <span className="workspace-tree-kind" aria-hidden="true">
                      Grimório
                    </span>
                    <span className="workspace-tree-label">
                      {grimoire.title}
                    </span>
                  </button>

                  <button
                    className="workspace-tree-toggle"
                    type="button"
                    aria-label={`${collapsed ? "Expandir" : "Recolher"} ${grimoire.title}`}
                    aria-expanded={!collapsed}
                    onClick={() => toggleGrimoire(grimoire.id)}
                  >
                    <span aria-hidden="true">{collapsed ? "+" : "−"}</span>
                  </button>
                </div>

                {!collapsed && grimoire.notebooks?.length ? (
                  <ul className="workspace-tree-list workspace-tree-list--nested">
                    {grimoire.notebooks.map((notebook) => {
                      const notebookOnPath = state.notebookId === notebook.id;
                      const notebookSelected =
                        notebookOnPath && !state.chapterId;

                      return (
                        <li className="workspace-tree-node" key={notebook.id}>
                          <button
                            className="workspace-tree-item workspace-tree-item--notebook"
                            type="button"
                            data-active-path={
                              notebookOnPath ? "true" : undefined
                            }
                            data-selected={
                              notebookSelected ? "true" : undefined
                            }
                            aria-current={
                              notebookSelected ? "true" : undefined
                            }
                            onClick={() => onOpenNotebook(notebook.id)}
                          >
                            <span
                              className="workspace-tree-kind"
                              aria-hidden="true"
                            >
                              Caderno
                            </span>
                            <span className="workspace-tree-label">
                              {notebook.title}
                            </span>
                          </button>

                          {notebook.chapters?.length ? (
                            <ul className="workspace-tree-list workspace-tree-list--nested">
                              {notebook.chapters.map((chapter) => {
                                const chapterOnPath =
                                  state.chapterId === chapter.id;
                                const chapterSelected =
                                  chapterOnPath && !state.pageId;

                                return (
                                  <li
                                    className="workspace-tree-node"
                                    key={chapter.id}
                                  >
                                    <button
                                      className="workspace-tree-item workspace-tree-item--chapter"
                                      type="button"
                                      data-active-path={
                                        chapterOnPath ? "true" : undefined
                                      }
                                      data-selected={
                                        chapterSelected ? "true" : undefined
                                      }
                                      aria-current={
                                        chapterSelected ? "true" : undefined
                                      }
                                      onClick={() =>
                                        onOpenChapter(chapter.id)
                                      }
                                    >
                                      <span
                                        className="workspace-tree-kind"
                                        aria-hidden="true"
                                      >
                                        Capítulo
                                      </span>
                                      <span className="workspace-tree-label">
                                        {chapter.title}
                                      </span>
                                    </button>

                                    {chapter.pages?.length ? (
                                      <ul className="workspace-tree-list workspace-tree-list--nested">
                                        {chapter.pages.map((page) => {
                                          const pageSelected =
                                            state.pageId === page.id;

                                          return (
                                            <li
                                              className="workspace-tree-node"
                                              key={page.id}
                                            >
                                              <button
                                                className="workspace-tree-item workspace-tree-item--page"
                                                type="button"
                                                tabIndex={0}
                                                data-active-path={
                                                  pageSelected
                                                    ? "true"
                                                    : undefined
                                                }
                                                data-selected={
                                                  pageSelected
                                                    ? "true"
                                                    : undefined
                                                }
                                                aria-current={
                                                  pageSelected
                                                    ? "page"
                                                    : undefined
                                                }
                                                onClick={() =>
                                                  onOpenPage(page.id)
                                                }
                                              >
                                                <span
                                                  className="workspace-tree-kind"
                                                  aria-hidden="true"
                                                >
                                                  Página
                                                </span>
                                                <span className="workspace-tree-label">
                                                  {page.title}
                                                </span>
                                              </button>
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    ) : null}
                                  </li>
                                );
                              })}
                            </ul>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}
