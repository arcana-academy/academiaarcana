"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { CalendarDays, Send } from "lucide-react";
import type { StudyTask } from "@/domains/planning";

type OutlookEvent = {
  id: string;
  subject: string | null;
  start: { dateTime: string; timeZone?: string | null };
  end: { dateTime: string; timeZone?: string | null };
  webLink?: string | null;
  isCancelled?: boolean | null;
};

type StudyTaskBoardProps = {
  tasks: StudyTask[];
  outlookConnected?: boolean;
  outlookEvents?: OutlookEvent[];
  outlookEventsUnavailable?: boolean;
  /** Allows visual pilots to compare reviewed copy without mutating hydrated DOM. */
  pendingTasksHeading?: "Tarefas futuras" | "Tarefas pendentes";
  onCreate: (input: { title: string; dueAt: string | null }) => Promise<StudyTask>;
  onComplete: (id: string) => Promise<StudyTask>;
  onScheduleInOutlook?: (id: string) => Promise<{ webLink?: string | null }>;
};

// Render locale-dependent dates only after hydration. On the server and
// initial hydration, the snapshot is the same even if the browser's time zone
// differs from the CI/runtime region.
const subscribeNoop = () => () => {};
function useBrowserHydrated(): boolean {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

function formatDueAt(value: string | null, browserHydrated: boolean): string {
  if (!value) return "Sem prazo";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Data indisponível";
  if (!browserHydrated) return "Carregando horário local…";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/** Outlook Graph may provide a UTC wall time without an explicit offset. */
function formatOutlookDateTime(value: string, browserHydrated: boolean, timeZone?: string | null): string {
  if (typeof timeZone !== "string" || !timeZone.trim()) return "Data indisponível";
  const utcWithoutOffset =
    timeZone.toUpperCase() === "UTC" &&
    /^\d{4}-\d{2}-\d{2}T/.test(value) &&
    !/(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  return formatDueAt(utcWithoutOffset ? `${value}Z` : value, browserHydrated);
}

export function StudyTaskBoard({
  tasks,
  outlookConnected = false,
  outlookEvents = [],
  outlookEventsUnavailable = false,
  pendingTasksHeading = "Tarefas pendentes",
  onCreate,
  onComplete,
  onScheduleInOutlook,
}: StudyTaskBoardProps) {
  const browserHydrated = useBrowserHydrated();
  // Changes returned by the server are authoritative, while local creations
  // and completions remain visible/hidden until acknowledged by a new snapshot.
  const [locallyCreated, setLocallyCreated] = useState<StudyTask[]>([]);
  const [locallyCompleted, setLocallyCompleted] = useState<Set<string>>(() => new Set());
  const [acknowledgment, setAcknowledgment] = useState(() => ({
    serverTasks: tasks,
    localCreates: locallyCreated,
    createdSeen: new Set<string>(),
    completedAbsent: new Set<string>(),
  }));

  if (acknowledgment.serverTasks !== tasks || acknowledgment.localCreates !== locallyCreated) {
    const serverIds = new Set(tasks.map((task) => task.id));
    const createdSeen = new Set(acknowledgment.createdSeen);
    for (const created of locallyCreated) {
      if (serverIds.has(created.id)) createdSeen.add(created.id);
    }
    const completedAbsent = new Set(acknowledgment.completedAbsent);
    if (acknowledgment.serverTasks !== tasks) {
      for (const id of locallyCompleted) {
        if (!serverIds.has(id)) completedAbsent.add(id);
      }
    }
    setAcknowledgment({ serverTasks: tasks, localCreates: locallyCreated, createdSeen, completedAbsent });
  }

  const items = useMemo(() => {
    const serverIds = new Set(tasks.map((task) => task.id));
    return [
      ...tasks.filter(
        (task) => !locallyCompleted.has(task.id) || acknowledgment.completedAbsent.has(task.id),
      ),
      ...locallyCreated.filter(
        (task) =>
          !serverIds.has(task.id) &&
          !acknowledgment.createdSeen.has(task.id) &&
          !locallyCompleted.has(task.id),
      ),
    ];
  }, [tasks, locallyCreated, locallyCompleted, acknowledgment.createdSeen, acknowledgment.completedAbsent]);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Guard the callbacks synchronously, before disabled controls rerender.
  const createPending = useRef(false);
  const completingPending = useRef(new Set<string>());
  const [completingIds, setCompletingIds] = useState<Set<string>>(() => new Set());
  const activeSends = useRef(new Set<string>());
  const successfulSends = useRef(new Set<string>());
  const [sendingKeys, setSendingKeys] = useState<Set<string>>(() => new Set());
  const [sentIds, setSentIds] = useState<Set<string>>(() => new Set());
  const [asanaSentIds, setAsanaSentIds] = useState<Set<string>>(() => new Set());
  // Protect each Outlook task synchronously, even before React rerenders.
  const activeSchedules = useRef(new Set<string>());
  const completedSchedules = useRef(new Set<string>());
  const [schedulingIds, setSchedulingIds] = useState<Set<string>>(() => new Set());
  const [scheduledIds, setScheduledIds] = useState<Set<string>>(() => new Set());
  const submit = async () => {
    if (createPending.current || !title.trim()) return;
    createPending.current = true;
    setError(null);
    setIsSubmitting(true);
    try {
      const created = await onCreate({ title, dueAt: dueAt ? new Date(dueAt).toISOString() : null });
      setLocallyCreated((current) => current.some((task) => task.id === created.id) ? current : [...current, created]);
      setTitle("");
      setDueAt("");
    } catch {
      setError("Não foi possível criar a tarefa.");
    } finally {
      createPending.current = false;
      setIsSubmitting(false);
    }
  };

  const beginSend = (provider: "todoist" | "asana", id: string) => {
    const key = `${provider}:${id}`;
    if (activeSends.current.has(key) || successfulSends.current.has(key)) return null;
    activeSends.current.add(key);
    setSendingKeys((current) => new Set([...current, key]));
    return key;
  };

  const endSend = (key: string) => {
    activeSends.current.delete(key);
    setSendingKeys((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  };

  const sendToTodoist = async (task: StudyTask) => {
    const key = beginSend("todoist", task.id);
    if (!key) return;
    setError(null);

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

      successfulSends.current.add(key);
      setSentIds((current) => {
        const next = new Set(current);
        next.add(task.id);
        return next;
      });
    } catch {
      setError("Não foi possível enviar a tarefa para o Todoist.");
    } finally {
      endSend(key);
    }
  };

  const sendToAsana = async (task: StudyTask) => {
    const key = beginSend("asana", task.id);
    if (!key) return;
    setError(null);

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

      successfulSends.current.add(key);
      setAsanaSentIds((current) => {
        const next = new Set(current);
        next.add(task.id);
        return next;
      });
    } catch {
      setError("Não foi possível enviar a tarefa para o Asana.");
    } finally {
      endSend(key);
    }
  };

  const scheduleInOutlook = async (id: string) => {
    if (
      !onScheduleInOutlook ||
      activeSchedules.current.has(id) ||
      completedSchedules.current.has(id)
    ) return;

    activeSchedules.current.add(id);
    setSchedulingIds((current) => new Set([...current, id]));
    setError(null);
    try {
      const event = await onScheduleInOutlook(id);
      completedSchedules.current.add(id);
      setScheduledIds((current) => new Set([...current, id]));
      if (event.webLink) window.open(event.webLink, "_blank", "noopener,noreferrer");
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message === "STUDY_TASK_WITHOUT_SCHEDULE"
          ? "Defina um horário na tarefa antes de enviá-la ao Outlook."
          : "Não foi possível criar o evento no Outlook.",
      );
    } finally {
      activeSchedules.current.delete(id);
      setSchedulingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };
  const complete = async (id: string) => {
    if (completingPending.current.has(id)) return;
    completingPending.current.add(id);
    setCompletingIds((current) => new Set([...current, id]));
    setError(null);
    try {
      await onComplete(id);
      // A second completion of a legitimately reopened task starts a new cycle.
      setAcknowledgment((current) => {
        if (!current.completedAbsent.has(id)) return current;
        const completedAbsent = new Set(current.completedAbsent);
        completedAbsent.delete(id);
        return { ...current, completedAbsent };
      });
      setLocallyCompleted((current) => new Set([...current, id]));
    } catch {
      setError("Não foi possível concluir a tarefa.");
    } finally {
      completingPending.current.delete(id);
      setCompletingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <main className="aa-page aa-page-narrow aa-study-task-board" aria-labelledby="cronograma-title">
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
              <input className="aa-input" id="study-task-due" type="datetime-local" lang="pt-BR" value={dueAt} onChange={(event) => setDueAt(event.target.value)} disabled={isSubmitting} />
            </div>
            <button className="aa-button aa-button-primary" type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? "Criando…" : "Criar tarefa"}
            </button>
          </div>
          {error ? <p role="alert" className="aa-field-error">{error}</p> : null}
        </form>
      </section>

      <section className="aa-surface aa-sanctuary-section" aria-labelledby="outlook-title">
        <div className="aa-surface-header">
          <div>
            <p className="aa-eyebrow">Integração de agenda</p>
            <h2 id="outlook-title">Outlook Calendar</h2>
          </div>
          <span className="aa-badge aa-badge-neutral">
            {outlookConnected ? "Conectado" : outlookEventsUnavailable ? "Indisponível" : "Não conectado"}
          </span>
        </div>
        <p>
          {outlookConnected
            ? "Tarefas com horário podem ser transformadas em eventos no seu calendário."
            : "Conecte seu calendário para transformar tarefas do Cronograma em eventos reais."}
        </p>
        {outlookEventsUnavailable && !outlookConnected ? (
          <p role="status">Não foi possível verificar a conexão do Outlook agora. Suas tarefas de estudo continuam disponíveis.</p>
        ) : outlookConnected ? (
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
          {outlookEventsUnavailable ? (
            <div className="aa-empty" role="status">
              <p>Não foi possível carregar os eventos do Outlook agora.</p>
              <p>Suas tarefas de estudo continuam disponíveis. Tente atualizar a página mais tarde.</p>
            </div>
          ) : outlookEvents.length === 0 ? (
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
                      {formatOutlookDateTime(event.start.dateTime, browserHydrated, event.start.timeZone)} · até {formatOutlookDateTime(event.end.dateTime, browserHydrated, event.end.timeZone)}
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

      <section className="aa-surface aa-sanctuary-section" aria-labelledby="upcoming-tasks-title">
        <div className="aa-surface-header">
          <div><p className="aa-eyebrow">Próximos passos</p><h2 id="upcoming-tasks-title">{pendingTasksHeading}</h2></div>
          <span className="aa-badge aa-badge-neutral">{items.length}</span>
        </div>
        {items.length === 0 ? (
          <div className="aa-empty">
            <p>Nenhuma tarefa pendente.</p>
            <a className="aa-button aa-button-secondary aa-button-sm" href="#study-task-title">
              Criar primeira tarefa
            </a>
          </div>
        ) : (
          <ul className="aa-list aa-planning-list">
            {items.map((task) => (
              <li className="aa-list-item" key={task.id}>
                <div><strong>{task.title}</strong><small>{formatDueAt(task.dueAt, browserHydrated)}</small></div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--aa-spacing-sm)" }}>
                  <button
                    className="aa-button aa-button-secondary aa-button-sm"
                    type="button"
                    onClick={() => void sendToTodoist(task)}
                    disabled={sendingKeys.has(`todoist:${task.id}`) || sentIds.has(task.id)}
                    title={sentIds.has(task.id) ? "Tarefa já enviada para o Todoist nesta sessão" : "Enviar uma cópia para o Todoist"}
                  >
                    <Send size={16} aria-hidden="true" />
                    {sendingKeys.has(`todoist:${task.id}`) ? "Enviando…" : sentIds.has(task.id) ? "Enviado" : "Enviar ao Todoist"}
                  </button>
                  <button
                    className="aa-button aa-button-secondary aa-button-sm"
                    type="button"
                    onClick={() => void sendToAsana(task)}
                    disabled={sendingKeys.has(`asana:${task.id}`) || asanaSentIds.has(task.id)}
                    title={
                      asanaSentIds.has(task.id)
                        ? "Tarefa já enviada para o Asana nesta sessão"
                        : "Enviar uma cópia para o Asana"
                    }
                  >
                    <Send size={16} aria-hidden="true" />
                    {sendingKeys.has(`asana:${task.id}`)
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
                      disabled={schedulingIds.has(task.id) || scheduledIds.has(task.id)}
                      title="Criar um evento no Outlook para este horário"
                    >
                      <CalendarDays size={16} aria-hidden="true" />
                      {schedulingIds.has(task.id)
                        ? "Agendando…"
                        : scheduledIds.has(task.id)
                          ? "Agendado no Outlook"
                          : "Agendar no Outlook"}
                    </button>
                  ) : null}
                  <button className="aa-button aa-button-secondary aa-button-sm" type="button" onClick={() => void complete(task.id)} disabled={completingIds.has(task.id)}>
                    {completingIds.has(task.id) ? "Concluindo…" : "Concluir"}
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
