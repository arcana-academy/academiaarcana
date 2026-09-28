"use client";

import { useState } from "react";

import type { StudyTask } from "@/domains/planning";

type StudyTaskBoardProps = {
  tasks: StudyTask[];
  onCreate: (input: {
    title: string;
    dueAt: string | null;
  }) => Promise<StudyTask>;
  onComplete: (id: string) => Promise<StudyTask>;
};

function formatDueAt(value: string | null): string {
  if (!value) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function StudyTaskBoard({
  tasks,
  onCreate,
  onComplete,
}: StudyTaskBoardProps) {
  const [items, setItems] = useState(tasks);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!title.trim()) return;

    setIsSubmitting(true);

    try {
      const created = await onCreate({
        title: title.trim(),
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      });
      setItems((current) => [...current, created]);
      setTitle("");
      setDueAt("");
    } catch {
      setError("Não foi possível criar a tarefa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const complete = async (id: string) => {
    setError(null);
    setCompletingId(id);

    try {
      await onComplete(id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch {
      setError("Não foi possível concluir a tarefa.");
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <main
      className="aa-page aa-page-wide"
      aria-labelledby="cronograma-title"
    >
      <header className="aa-card aa-card-elevated aa-page-header">
        <p className="aa-eyebrow">Planejamento</p>
        <h1 id="cronograma-title">Cronograma</h1>
        <p className="aa-page-intro">
          Transforme a próxima ação de estudo em uma tarefa clara, com prazo
          opcional e feedback imediato.
        </p>
      </header>

      <section
        className="aa-card aa-card-default aa-section"
        aria-labelledby="new-task-title"
      >
        <header className="aa-page-header">
          <h2 id="new-task-title">Nova tarefa de estudo</h2>
          <p className="aa-page-intro">
            Defina apenas o necessário para colocar a tarefa em movimento.
          </p>
        </header>

        <form
          className="aa-form"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div className="aa-form-grid">
            <div className="aa-form-field">
              <label htmlFor="study-task-title">Tarefa</label>
              <input
                id="study-task-title"
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={isSubmitting}
                placeholder="Ex.: Revisar capítulo 2"
                required
              />
            </div>

            <div className="aa-form-field">
              <label htmlFor="study-task-due">Prazo</label>
              <input
                id="study-task-due"
                name="dueAt"
                type="datetime-local"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="aa-form-actions">
            <button
              className="aa-button aa-button-primary"
              type="submit"
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? "Criando…" : "Criar tarefa"}
            </button>
          </div>
        </form>

        {error ? (
          <div className="aa-alert aa-alert-danger" role="alert">
            <p>{error}</p>
          </div>
        ) : null}
      </section>

      <section className="aa-section" aria-labelledby="upcoming-tasks-title">
        <header className="aa-page-header">
          <h2 id="upcoming-tasks-title">Próximas tarefas</h2>
          <p className="aa-page-intro">
            {items.length === 0
              ? "Nenhuma tarefa pendente neste momento."
              : `${items.length} ${items.length === 1 ? "tarefa" : "tarefas"} aguardando atenção.`}
          </p>
        </header>

        {items.length === 0 ? (
          <div className="aa-empty-state" role="status">
            <h3>Nenhuma tarefa futura cadastrada.</h3>
            <p>Crie a próxima ação pequena e concreta do seu estudo.</p>
          </div>
        ) : (
          <ul className="aa-card-grid aa-task-list">
            {items.map((task) => {
              const isCompleting = completingId === task.id;

              return (
                <li className="aa-card aa-card-default aa-task-card" key={task.id}>
                  <div className="aa-card-heading-row">
                    <h3>{task.title}</h3>
                    <span className="aa-badge aa-badge-neutral">
                      {task.status === "pending" ? "Pendente" : task.status}
                    </span>
                  </div>
                  <p>{formatDueAt(task.dueAt)}</p>
                  <button
                    className="aa-button aa-button-secondary"
                    type="button"
                    disabled={isSubmitting || isCompleting}
                    onClick={() => void complete(task.id)}
                  >
                    {isCompleting ? "Concluindo…" : "Concluir"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
