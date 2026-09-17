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
    <nav aria-label="Navegação do workspace">
      {data.grimoires.length === 0 ? (
        <p role="status">Nenhum grimório encontrado</p>
      ) : (
        data.grimoires.map((grimoire) => {
          const collapsed = collapsedGrimoires.has(grimoire.id);

          return (
            <div key={grimoire.id}>
              <div>
                <button
                  type="button"
                  aria-current={
                    state.grimoireId === grimoire.id ? "true" : undefined
                  }
                  onClick={() => onOpenGrimoire(grimoire.id)}
                >
                  {grimoire.title}
                </button>

                <button
                  type="button"
                  aria-label={`${
                    collapsed ? "Expandir" : "Recolher"
                  } ${grimoire.title}`}
                  aria-expanded={!collapsed}
                  onClick={() => toggleGrimoire(grimoire.id)}
                >
                  {collapsed ? "Expandir" : "Recolher"}
                </button>
              </div>

              {!collapsed &&
                grimoire.notebooks?.map((notebook) => (
                  <div key={notebook.id} style={{ paddingLeft: "1rem" }}>
                    <button
                      type="button"
                      aria-current={
                        state.notebookId === notebook.id ? "true" : undefined
                      }
                      onClick={() => onOpenNotebook(notebook.id)}
                    >
                      {notebook.title}
                    </button>

                    {notebook.chapters?.map((chapter) => (
                      <div key={chapter.id} style={{ paddingLeft: "1rem" }}>
                        <button
                          type="button"
                          aria-current={
                            state.chapterId === chapter.id ? "true" : undefined
                          }
                          onClick={() => onOpenChapter(chapter.id)}
                        >
                          {chapter.title}
                        </button>

                        {chapter.pages?.map((page) => (
                          <div key={page.id} style={{ paddingLeft: "1rem" }}>
                            <button
                              type="button"
                              tabIndex={0}
                              aria-current={
                                state.pageId === page.id ? "page" : undefined
                              }
                              onClick={() => onOpenPage(page.id)}
                            >
                              {page.title}
                            </button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          );
        })
      )}
    </nav>
  );
}
