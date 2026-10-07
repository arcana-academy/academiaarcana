"use client";

import { useState } from "react";
import Image from "next/image";
import { CalendarDays, Send } from "lucide-react";
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
  outlookConnected?: boolean;
  outlookEvents?: OutlookEvent[];
  onCreate: (input: { title: string; dueAt: string | null }) => Promise<StudyTask>;
  onComplete: (id: string) => Promise<StudyTask>;
  onScheduleInOutlook?: (id: string) => Promise<{ webLink?: string | null }>;
};

function formatDueAt(value: string | null): string {
  if (!value) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function StudyTaskBoard({
  tasks,
  outlookConnected = false,
  outlookEvents = [],
  onCreate,
  onComplete,
  onScheduleInOutlook,
}: StudyTaskBoardProps) {
  const [items, setItems] = useState(tasks);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(() => new Set());
  const [asanaSentIds, setAsanaSentIds] = useState<Set<string>>(() => new Set());
  const [schedulingId, setSchedulingId] = useState<string | null>(null);

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

  const sendToTodoist = async (task: StudyTask) => {
    setError(null);
    setSendingId(task.id);

    try {
      const response = await fetch("/api/integrations/todoist/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: task.title,
          description: "Enviada a partir do Cronograma da Academia Arcana.",
          dueDateTime: task.dueAt,
        }),
      });

      if (response.status === 409 || response.status === 401) {
        setError("Conecte o Todoist em Integrações antes de enviar esta tarefa.");
        return;
      }

      if (!response.ok) throw new Error();

      setSentIds((current) => {
        const next = new Set(current);
        next.add(task.id);
        return next;
      });
    } catch {
      setError("Não foi possível enviar a tarefa para o Todoist.");
    } finally {
      setSendingId(null);
    }
  };

  const sendToAsana = async (task: StudyTask) => {
    setError(null);
    setSendingId(task.id);

    try {
      const response = await fetch("/api/integrations/asana/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: task.title,
          notes: "Enviada a partir do Cronograma da Academia Arcana.",
          dueOn: task.dueAt ? task.dueAt.slice(0, 10) : undefined,
        }),
      });

      if (response.status === 409 || response.status === 401) {
        setError("Conecte o Asana em Integrações antes de enviar esta tarefa.");
        return;
      }

      if (!response.ok) throw new Error();

      setAsanaSentIds((current) => {
        const next = new Set(current);
        next.add(task.id);
        return next;
      });
    } catch {
      setError("Não foi possível enviar a tarefa para o Asana.");
    } finally {
      setSendingId(null);
    }
  };

  const scheduleInOutlook = async (id: string) => {
    if (!onScheduleInOutlook) return;

    setError(null);
    setSchedulingId(id);
    try {
      const event = await onScheduleInOutlook(id);
      if (event.webLink) window.open(event.webLink, "_blank", "noopener,noreferrer");
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
        <div className="aa-page-header-knowledge">
          <Image
            className="aa-knowledge-mark"
            src="/assets/icons/aa-cronograma.svg"
            alt=""
            width={52}
            height={52}
            priority
          />
          <div className="aa-page-header-copy">
            <p className="aa-eyebrow">Planejamento · ritmo</p>
            <h1 id="cronograma-title">Cronograma</h1>
            <p>Transforme intenção em próximos passos claros, sem sobrecarregar sua visão.</p>
          </div>
        </div>
      </header>

      <section className="aa-surface aa-sanctuary-section" aria-labelledby="outlook-title">
        <div className="aa-surface-header">
          <div>
            <p className="aa-eyebrow">Integração de agenda</p>
            <h2 id="outlook-title">Outlook Calendar</h2>
          </div>
          <span className="aa-badge aa-badge-neutral">
            {outlookConnected ? "Conectado" : "Não conectado"}
          </span>
        </div>
        <p>
          {outlookConnected
            ? "Tarefas com horário podem ser transformadas em eventos no seu calendário."
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
            <span className="aa-badge aa-badge-neutral">{outlookEvents.length}</span>
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
                      {formatDueAt(event.start.dateTime)} · até {formatDueAt(event.end.dateTime)}
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
          <div><p className="aa-eyebrow">Novo passo</p><h2 id="new-task-title">Adicionar tarefa de estudo</h2></div>
        </div>
        <form
          className="aa-planning-form"
          aria-labelledby="new-task-title"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div className="aa-planning-form-row">
            <div className="aa-field">
              <label htmlFor="study-task-title">Tarefa</label>
              <input className="aa-input" id="study-task-title" value={title} onChange={(event) => setTitle(event.target.value)} disabled={isSubmitting} placeholder="Ex.: Revisar capítulo 2" />
            </div>
            <div className="aa-field">
              <label htmlFor="study-task-due">Prazo</label>
              <input className="aa-input" id="study-task-due" type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} disabled={isSubmitting} />
            </div>
            <button className="aa-button aa-button-primary" type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? "Criando…" : "Criar tarefa"}
            </button>
          </div>
          {error ? <p role="alert" className="aa-field-error">{error}</p> : null}
        </form>
      </section>

      <section className="aa-surface aa-sanctuary-section" aria-labelledby="upcoming-tasks-title">
        <div className="aa-surface-header">
          <div><p className="aa-eyebrow">Próximos passos</p><h2 id="upcoming-tasks-title">Tarefas futuras</h2></div>
          <span className="aa-badge aa-badge-neutral">{items.length}</span>
        </div>
        {items.length === 0 ? (
          <div className="aa-empty">
            <p>Nenhuma tarefa futura cadastrada.</p>
            <a className="aa-button aa-button-secondary aa-button-sm" href="#study-task-title">
              Criar primeira tarefa
            </a>
          </div>
        ) : (
          <ul className="aa-list aa-planning-list">
            {items.map((task) => (
              <li className="aa-list-item" key={task.id}>
                <div><strong>{task.title}</strong><small>{formatDueAt(task.dueAt)}</small></div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--aa-spacing-sm)" }}>
                  <button
                    className="aa-button aa-button-secondary aa-button-sm"
                    type="button"
                    onClick={() => void sendToTodoist(task)}
                    disabled={sendingId === task.id || sentIds.has(task.id)}
                    title={sentIds.has(task.id) ? "Tarefa já enviada para o Todoist nesta sessão" : "Enviar uma cópia para o Todoist"}
                  >
                    <Send size={16} aria-hidden="true" />
                    {sendingId === task.id ? "Enviando…" : sentIds.has(task.id) ? "Enviado" : "Enviar ao Todoist"}
                  </button>
                  <button
                    className="aa-button aa-button-secondary aa-button-sm"
                    type="button"
                    onClick={() => void sendToAsana(task)}
                    disabled={sendingId === task.id || asanaSentIds.has(task.id)}
                    title={
                      asanaSentIds.has(task.id)
                        ? "Tarefa já enviada para o Asana nesta sessão"
                        : "Enviar uma cópia para o Asana"
                    }
                  >
                    <Send size={16} aria-hidden="true" />
                    {sendingId === task.id
                      ? "Enviando…"
                      : asanaSentIds.has(task.id)
                        ? "Enviado ao Asana"
                        : "Enviar ao Asana"}
                  </button>
                  {outlookConnected && task.dueAt && onScheduleInOutlook ? (
                    <button
                      className="aa-button aa-button-secondary aa-button-sm"
                      type="button"
                      onClick={() => void scheduleInOutlook(task.id)}
                      disabled={schedulingId === task.id}
                      title="Criar um evento no Outlook para este horário"
                    >
                      <CalendarDays size={16} aria-hidden="true" />
                      {schedulingId === task.id ? "Enviando…" : "Agendar no Outlook"}
                    </button>
                  ) : null}
                  <button className="aa-button aa-button-secondary aa-button-sm" type="button" onClick={() => void complete(task.id)}>Concluir</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
