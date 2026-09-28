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
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function StudyTaskBoard({ tasks, onCreate, onComplete }: StudyTaskBoardProps) {
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
      const created = await onCreate({ title, dueAt: dueAt ? new Date(dueAt).toISOString() : null });
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
    <main className="aa-page aa-page-narrow" aria-labelledby="cronograma-title">
      <header className="aa-page-header">
        <div className="aa-page-header-copy">
          <p className="aa-eyebrow">Planejamento · ritmo</p>
          <h1 id="cronograma-title">Cronograma</h1>
          <p>Transforme intenção em próximos passos claros, sem sobrecarregar sua visão.</p>
        </div>
      </header>

      <section className="aa-surface aa-sanctuary-section" aria-labelledby="new-task-title">
        <div className="aa-surface-header">
          <div><p className="aa-eyebrow">Novo passo</p><h2 id="new-task-title">Adicionar tarefa de estudo</h2></div>
        </div>
        <div className="aa-planning-form">
          <div className="aa-planning-form-row">
            <div className="aa-field">
              <label htmlFor="study-task-title">Tarefa</label>
              <input className="aa-input" id="study-task-title" value={title} onChange={(event) => setTitle(event.target.value)} disabled={isSubmitting} placeholder="Ex.: Revisar capítulo 2" />
            </div>
            <div className="aa-field">
              <label htmlFor="study-task-due">Prazo</label>
              <input className="aa-input" id="study-task-due" type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} disabled={isSubmitting} />
            </div>
            <button className="aa-button aa-button-primary" type="button" disabled={isSubmitting || !title.trim()} onClick={submit}>
              {isSubmitting ? "Criando…" : "Criar tarefa"}
            </button>
          </div>
          {error ? <p role="alert" className="aa-field-error">{error}</p> : null}
        </div>
      </section>

      <section className="aa-surface aa-sanctuary-section" aria-labelledby="upcoming-tasks-title">
        <div className="aa-surface-header">
          <div><p className="aa-eyebrow">Próximos passos</p><h2 id="upcoming-tasks-title">Tarefas futuras</h2></div>
          <span className="aa-badge aa-badge-neutral">{items.length}</span>
        </div>
        {items.length === 0 ? (
          <div className="aa-empty"><p>Nenhuma tarefa futura cadastrada.</p></div>
        ) : (
          <ul className="aa-list aa-planning-list">
            {items.map((task) => (
              <li className="aa-list-item" key={task.id}>
                <div><strong>{task.title}</strong><small>{formatDueAt(task.dueAt)}</small></div>
                <button className="aa-button aa-button-secondary aa-button-sm" type="button" onClick={() => complete(task.id)}>Concluir</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
