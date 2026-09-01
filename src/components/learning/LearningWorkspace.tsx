"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { TaskStateBadge } from "./TaskStateBadge";
import { applyLearningView, groupLearningDocuments } from "@/domains/learning/workspace/views";
import type { LearningDocument, LearningViewConfig, LearningViewKind } from "@/domains/learning/workspace/types";

export interface LearningWorkspaceProps {
  documents: readonly LearningDocument[];
  initialView?: LearningViewKind;
}

const VIEW_LABELS: Record<LearningViewKind, string> = {
  list: "Lista",
  board: "Quadro",
  cards: "Cartões",
  table: "Tabela",
};

export function LearningWorkspace({ documents, initialView = "list" }: LearningWorkspaceProps) {
  const [kind, setKind] = useState<LearningViewKind>(initialView);
  const [query, setQuery] = useState("");
  const [groupBy, setGroupBy] = useState<LearningViewConfig["groupBy"]>();

  const view: LearningViewConfig = {
    id: "workspace",
    name: "Espaço de estudo",
    kind,
    groupBy,
  };

  const visible = useMemo(
    () => applyLearningView(documents, view).filter((document) =>
      `${document.title} ${document.excerpt ?? ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
    ),
    [documents, query, kind, groupBy],
  );

  const grouped = useMemo(() => groupLearningDocuments(visible, view), [visible, kind, groupBy]);

  return (
    <section aria-labelledby="learning-workspace-title" className="aa-learning-workspace">
      <div className="aa-learning-workspace-toolbar">
        <div>
          <h2 id="learning-workspace-title">Espaço de estudo</h2>
          <p>Organize notas, referências e tarefas em uma visão que você consegue entender de imediato.</p>
        </div>
        <div className="aa-learning-workspace-controls" aria-label="Controles do espaço de estudo">
          <label className="aa-learning-search">
            <span className="aa-visually-hidden">Pesquisar no espaço</span>
            <input
              className="aa-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquisar…"
              type="search"
            />
          </label>
          <select
            className="aa-input"
            value={groupBy ?? ""}
            onChange={(event) => setGroupBy(event.target.value ? (event.target.value as LearningViewConfig["groupBy"]) : undefined)}
            aria-label="Agrupar por"
          >
            <option value="">Sem agrupamento</option>
            <option value="type">Tipo</option>
            <option value="status">Estado da tarefa</option>
            <option value="priority">Prioridade</option>
          </select>
          <div className="aa-learning-view-switcher" aria-label="Modo de visualização">
            {(Object.keys(VIEW_LABELS) as LearningViewKind[]).map((item) => (
              <button
                key={item}
                type="button"
                className={`aa-button aa-button-sm ${kind === item ? "aa-button-secondary" : "aa-button-ghost"}`}
                aria-pressed={kind === item}
                onClick={() => setKind(item)}
              >
                {VIEW_LABELS[item]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <Card variant="inset">
          <strong>Nenhum resultado encontrado.</strong>
          <p>Experimente remover filtros ou pesquisar por outro termo.</p>
        </Card>
      ) : (
        Object.entries(grouped).map(([group, items]) => (
          <section key={group} aria-labelledby={`learning-group-${group}`} className="aa-learning-group">
            {group !== "all" ? <h3 id={`learning-group-${group}`}>{group}</h3> : null}
            <div className={`aa-learning-grid aa-learning-view-${kind}`}>
              {items.map((document) => (
                <Card key={document.id} as="article">
                  <div className="aa-learning-document-head">
                    <div>
                      <span className="aa-learning-document-type">{document.type}</span>
                      <h3>{document.title}</h3>
                    </div>
                  </div>
                  {document.excerpt ? <p>{document.excerpt}</p> : null}
                  {document.properties.length > 0 ? (
                    <dl className="aa-learning-properties">
                      {document.properties.slice(0, 4).map((property) => (
                        <div key={property.id}>
                          <dt>{property.label}</dt>
                          <dd>{String(property.value ?? "—")}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                  {document.tasks.length > 0 ? (
                    <div className="aa-learning-task-list" aria-label="Tarefas">
                      {document.tasks.slice(0, 4).map((task) => (
                        <div key={task.id}>
                          <span>{task.title}</span>
                          <TaskStateBadge status={task.status} priority={task.priority} />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>
          </section>
        ))
      )}
    </section>
  );
}
