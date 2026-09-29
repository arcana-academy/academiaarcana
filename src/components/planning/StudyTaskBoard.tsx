"use client";

import { useState } from "react";
import type { StudyTask } from "@/domains/planning";

type OutlookEvent = {
  id: string;
  subject: string | null;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  webLink?: string | null;
  isCancelled?: boolean | null;
};

type StudyTaskBoardProps = {
  tasks: StudyTask[];
  outlookConnected: boolean;
  outlookEvents: OutlookEvent[];
  onCreate: (input: { title: string; dueAt: string | null }) => Promise<StudyTask>;
  onComplete: (id: string) => Promise<StudyTask>;
  onScheduleInOutlook: (id: string) => Promise<{ webLink?: string | null }>;
};

function formatDueAt(value: string | null): string {
  if (!value) return "Sem horário";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function StudyTaskBoard({
  tasks,
  outlookConnected,
  outlookEvents,
  onCreate,
  onComplete,
  onScheduleInOutlook,
}: StudyTaskBoardProps) {
  const [items, setItems] = useState(tasks);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);

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

  const scheduleInOutlook = async (id: string) => {
    setError(null);
    setSchedulingId(id);
    try {
      await onScheduleInOutlook(id);
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message === "STUDY_TASK_WITHOUT_SCHEDULE"
          ? "Defina um horário na tarefa antes de enviá-la ao Outlook."
          : "Não foi possível criar o evento no Outlook.",
      );
    } finally {
      setSchedulingId(null);
    }
  };

  return (
    <main className="aa-page aa-page-narrow" aria-labelledby="cronograma-title">
      <header className="aa-page-header">
        <div className="aa-page-header-copy">
          <p className="aa-eyebrow">Planejamento · ritmo</p>
          <h1 id="cronograma-title">Cronograma</h1>
          <p>
            Transforme intenção em próximos passos claros, sem sobrecarregar sua
            visão.
          </p>
        </div>
      </header>

      <section className="aa-surface aa-sanctuary-section" aria-labelledby="outlook-title">
        <div className="aa-surface-header">
          <div>
            <p className="aa-eyebrow">Integração</p>
            <h2 id="outlook-title">Outlook Calendar</h2>
          </div>
          <span className="aa-badge aa-badge-neutral">
            {outlookConnected ? "Conectado" : "Não conectado"}
          </span>
        </div>
        <p>
          {outlookConnected
            ? "Envie tarefas com horário para o seu calendário do Outlook."
            : "Conecte seu calendário para transformar tarefas do Cronograma em eventos reais."}
        </p>
        {outlookConnected ? (
          <form action="/api/integrations/outlook/disconnect" method="post">
            <button
              className="aa-button aa-button-secondary aa-button-sm"
              type="submit"
            >
              Desconectar Outlook
            </button>
          </form>
        ) : (
          <a
            className="aa-button aa-button-secondary"
            href="/api/integrations/outlook/authorize"
          >
            Conectar Outlook Calendar
          </a>
        )}
      </section>

      {outlookConnected ? (
        <section
          className="aa-surface aa-sanctuary-section"
          aria-labelledby="outlook-events-title"
        >
          <div className="aa-surface-header">
            <div>
              <p className="aa-eyebrow">Agenda externa · próximos 7 dias</p>
              <h2 id="outlook-events-title">Eventos do Outlook</h2>
            </div>
            <span className="aa-badge aa-badge-neutral">
              {outlookEvents.length}
            </span>
          </div>
          {outlookEvents.length === 0 ? (
            <div className="aa-empty">
              <p>Nenhum evento encontrado no Outlook neste período.</p>
            </div>
          ) : (
            <ul className="aa-list aa-planning-list">
              {outlookEvents.slice(0, 10).map((event) => (
                <li className="aa-list-item" key={event.id}>
                  <div>
                    <strong>{event.subject || "Evento sem título"}</strong>
                    <small>
                      {formatDueAt(event.start.dateTime)} · até{" "}
                      {formatDueAt(event.end.dateTime)}
                    </small>
                  </div>
                  {event.webLink ? (
                    <a
                      className="aa-button aa-button-secondary aa-button-sm"
                      href={event.webLink}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Abrir Outlook
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section className="aa-surface aa-sanctuary-section" aria-labelledby="new-task-title">
        <div className="aa-surface-header">
          <div>
            <p className="aa-eyebrow">Novo passo</p>
            <h2 id="new-task-title">Adicionar tarefa de estudo</h2>
          </div>
        </div>
        <div className="aa-planning-form">
          <div className="aa-planning-form-row">
            <div className="aa-field">
              <label htmlFor="study-task-title">Tarefa</label>
              <input
                className="aa-input"
                id="study-task-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={isSubmitting}
                placeholder="Ex.: Revisar capítulo 2"
              />
            </div>
            <div className="aa-field">
              <label htmlFor="study-task-due">Horário</label>
              <input
                className="aa-input"
                id="study-task-due"
                type="datetime-local"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <button
              className="aa-button aa-button-primary"
              type="button"
              disabled={isSubmitting || !title.trim()}
              onClick={() => void submit()}
            >
              {isSubmitting ? "Criando…" : "Criar tarefa"}
            </button>
          </div>
          {error ? (
            <p role="alert" className="aa-field-error">
              {error}
            </p>
          ) : null}
        </div>
      </section>

      <section className="aa-surface aa-sanctuary-section" aria-labelledby="upcoming-tasks-title">
        <div className="aa-surface-header">
          <div>
            <p className="aa-eyebrow">Próximos passos</p>
            <h2 id="upcoming-tasks-title">Tarefas futuras</h2>
          </div>
          <span className="aa-badge aa-badge-neutral">{items.length}</span>
        </div>
        {items.length === 0 ? (
          <div className="aa-empty">
            <p>Nenhuma tarefa futura cadastrada.</p>
          </div>
        ) : (
          <ul className="aa-list aa-planning-list">
            {items.map((task) => (
              <li className="aa-list-item" key={task.id}>
                <div>
                  <strong>{task.title}</strong>
                  <small>{formatDueAt(task.dueAt)}</small>
                </div>
                <div className="aa-button-row">
                  {outlookConnected && task.dueAt ? (
                    <button
                      className="aa-button aa-button-secondary aa-button-sm"
                      type="button"
                      disabled={schedulingId === task.id}
                      onClick={() => void scheduleInOutlook(task.id)}
                    >
                      {schedulingId === task.id
                        ? "Enviando…"
                        : "Agendar no Outlook"}
                    </button>
                  ) : null}
                  <button
                    className="aa-button aa-button-secondary aa-button-sm"
                    type="button"
                    onClick={() => void complete(task.id)}
                  >
                    Concluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
