"use client";

import { useState } from "react";

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

  const submit = async () => {
    setError(null);
    if (!title.trim()) return;

    setIsSubmitting(true);

    try {
      const created = await onCreate({
        title,
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

    try {
      await onComplete(id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch {
      setError("Não foi possível concluir a tarefa.");
    }
  };

  return (
    <main aria-labelledby="cronograma-title">
      <h1 id="cronograma-title">Cronograma</h1>

      <section aria-labelledby="new-task-title">
        <h2 id="new-task-title">Nova tarefa de estudo</h2>
        <label htmlFor="study-task-title">Tarefa</label>
        <input
          id="study-task-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={isSubmitting}
          placeholder="Ex.: Revisar capítulo 2"
        />

        <label htmlFor="study-task-due">Prazo</label>
        <input
          id="study-task-due"
          type="datetime-local"
          value={dueAt}
          onChange={(event) => setDueAt(event.target.value)}
          disabled={isSubmitting}
        />

        <button
          type="button"
          disabled={isSubmitting || !title.trim()}
          onClick={submit}
        >
          {isSubmitting ? "Criando…" : "Criar tarefa"}
        </button>

        {error ? <p role="alert">{error}</p> : null}
      </section>

      <section aria-labelledby="upcoming-tasks-title">
        <h2 id="upcoming-tasks-title">Próximas tarefas</h2>

        {items.length === 0 ? (
          <p>Nenhuma tarefa futura cadastrada.</p>
        ) : (
          <ul>
            {items.map((task) => (
              <li key={task.id}>
                <span>{task.title}</span>
                <span>{formatDueAt(task.dueAt)}</span>
                <button
                  type="button"
                  onClick={() => complete(task.id)}
                >
                  Concluir
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
