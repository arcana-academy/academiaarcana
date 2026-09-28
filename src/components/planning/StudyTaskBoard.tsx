"use client";

import { FormEvent, useState } from "react";
import { CalendarPlus, CheckCircle2 } from "lucide-react";

import type { StudyTask } from "@/domains/planning";

type StudyTaskBoardProps = {
  tasks: StudyTask[];
  onCreate: (input: { title: string; dueAt: string | null }) => Promise<StudyTask>;
  onComplete: (id: string) => Promise<StudyTask>;
};

function formatDueAt(value: string | null): string {
  if (!value) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function StudyTaskBoard({ tasks, onCreate, onComplete }: StudyTaskBoardProps) {
  const [items, setItems] = useState(tasks);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Digite um título para a tarefa.");
      return;
    }

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
      setError("Não foi possível criar a tarefa. Tente novamente.");
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
      setError("Não foi possível concluir a tarefa. Tente novamente.");
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <main className="aa-page" aria-labelledby="cronograma-title">
      <header className="aa-card aa-card-elevated aa-page-header">
        <p className="aa-eyebrow">Planejamento</p>
        <h1 id="cronograma-title">Cronograma</h1>
        <p>Transforme o próximo passo de estudo em uma tarefa concreta.</p>
      </header>

      <div className="aa-task-layout">
        <section className="aa-card aa-card-default aa-task-form" aria-labelledby="new-task-title">
          <div className="aa-card-icon" aria-hidden="true">
            <CalendarPlus size={20} strokeWidth={1.8} />
          </div>
          <h2 id="new-task-title">Nova tarefa de estudo</h2>
          <form className="aa-form" onSubmit={submit}>
            <div className="aa-field">
              <label htmlFor="study-task-title">Tarefa</label>
              <input
                id="study-task-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={isSubmitting}
                placeholder="Ex.: Revisar capítulo 2"
                maxLength={200}
                required
              />
            </div>

            <div className="aa-field">
              <label htmlFor="study-task-due">Prazo</label>
              <input
                id="study-task-due"
                type="datetime-local"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <button
              className="aa-button aa-button-primary"
              type="submit"
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? "Criando…" : "Criar tarefa"}
            </button>
          </form>
          {error ? <p className="aa-field-error" role="alert">{error}</p> : null}
        </section>

        <section className="aa-card aa-card-default" aria-labelledby="upcoming-tasks-title">
          <div className="aa-section-heading">
            <div>
              <p className="aa-eyebrow">Próximos passos</p>
              <h2 id="upcoming-tasks-title">Próximas tarefas</h2>
            </div>
            <p>{items.length} pendente(s)</p>
          </div>

          {items.length === 0 ? (
            <div className="aa-state-card" data-state="success">
              <CheckCircle2 size={20} aria-hidden="true" />
              <p>Nenhuma tarefa futura cadastrada.</p>
            </div>
          ) : (
            <ul className="aa-task-list">
              {items.map((task) => {
                const isCompleting = completingId === task.id;
                return (
                  <li className="aa-task-item" key={task.id}>
                    <div>
                      <strong>{task.title}</strong>
                      <span className="aa-task-due">{formatDueAt(task.dueAt)}</span>
                    </div>
                    <button
                      className="aa-button aa-button-secondary"
                      type="button"
                      disabled={completingId !== null}
                      aria-busy={isCompleting || undefined}
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
      </div>
    </main>
  );
}
