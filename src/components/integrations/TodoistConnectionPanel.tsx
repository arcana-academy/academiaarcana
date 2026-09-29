"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { CalendarDays, CheckCircle2, ExternalLink, Plus, RefreshCw, Unplug } from "lucide-react";

type TodoistTask = {
  id: string;
  content: string;
  description?: string;
  due?: { date: string; datetime?: string; string?: string } | null;
  priority?: number;
};

type TodoistStatus =
  | { status: "disconnected" }
  | { status: "connected"; user?: { fullName?: string; email?: string }; verifiedAt?: string }
  | { status: "reauthorization_required" };

type TodoistData = { status: "connected" | "reauthorization_required"; tasks?: TodoistTask[] };

export function TodoistConnectionPanel() {
  const [status, setStatus] = useState<TodoistStatus>({ status: "disconnected" });
  const [tasks, setTasks] = useState<TodoistTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newDueAt, setNewDueAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/todoist/status", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const nextStatus = (await response.json()) as TodoistStatus;
      setStatus(nextStatus);
      if (nextStatus.status === "connected") {
        const tasksResponse = await fetch("/api/integrations/todoist/tasks", { cache: "no-store" });
        if (tasksResponse.ok) {
          const data = (await tasksResponse.json()) as TodoistData;
          if (data.status === "connected") setTasks(data.tasks?.slice(0, 8) ?? []);
          else { setStatus({ status: "reauthorization_required" }); setTasks([]); }
        }
      } else {
        setTasks([]);
      }
    } catch {
      setError("Não foi possível consultar o estado do Todoist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const disconnect = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/todoist/disconnect", { method: "POST" });
      if (!response.ok) throw new Error();
      setStatus({ status: "disconnected" });
      setTasks([]);
    } catch {
      setError("Não foi possível desconectar o Todoist.");
    } finally {
      setBusy(false);
    }
  };

  const createTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = newContent.trim();
    if (!content) return;
    setIsCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/todoist/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, dueDateTime: newDueAt ? new Date(newDueAt).toISOString() : null }),
      });
      const body = (await response.json().catch(() => null)) as TodoistTask | { error?: string } | null;
      if (response.status === 401 || response.status === 409) {
        setStatus({ status: "reauthorization_required" });
        setError("Conecte o Todoist novamente para criar tarefas.");
        return;
      }
      if (!response.ok || !body || !("id" in body)) throw new Error();
      setTasks((current) => [body, ...current.filter((task) => task.id !== body.id)].slice(0, 8));
      setNewContent("");
      setNewDueAt("");
    } catch {
      setError("Não foi possível criar a tarefa no Todoist.");
    } finally {
      setIsCreating(false);
    }
  };

  const completeTask = async (taskId: string) => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/todoist/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      if (response.status === 409) {
        setStatus({ status: "reauthorization_required" });
        setError("Conecte o Todoist novamente para concluir tarefas.");
        return;
      }
      if (!response.ok) throw new Error();
      setTasks((current) => current.filter((task) => task.id !== taskId));
    } catch {
      setError("Não foi possível concluir a tarefa no Todoist.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <section className="aa-surface" aria-busy="true"><p>Consultando conexão do Todoist…</p></section>;

  return (
    <section className="aa-surface" aria-labelledby="todoist-connection-title">
      <div className="aa-surface-header">
        <div><p className="aa-eyebrow">Produtividade · cronograma</p><h2 id="todoist-connection-title">Todoist conectado</h2></div>
        <button type="button" className="aa-button aa-button-secondary aa-button-sm" onClick={() => void load()} disabled={busy || isCreating}>
          <RefreshCw size={16} aria-hidden="true" />Atualizar
        </button>
      </div>

      {status.status === "disconnected" ? (
        <div className="aa-empty">
          <p>Conecte sua conta para sincronizar sua camada de produtividade.</p>
          <a className="aa-button aa-button-primary" href="/api/integrations/todoist/connect">Conectar Todoist</a>
        </div>
      ) : status.status === "reauthorization_required" ? (
        <div className="aa-empty">
          <p>A autorização do Todoist precisa ser refeita.</p>
          <a className="aa-button aa-button-primary" href="/api/integrations/todoist/connect">Reconectar Todoist</a>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gap: "var(--aa-spacing-sm)" }}>
            <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}><CheckCircle2 size={18} aria-hidden="true" /><strong>Conectado</strong>{status.user?.fullName ? <span>{status.user.fullName}</span> : null}</div>
            {status.user?.email ? <p className="aa-state-copy" style={{ margin: 0 }}>Conta: {status.user.email}</p> : null}
          </div>

          <form onSubmit={createTask} className="aa-planning-form" style={{ marginTop: "var(--aa-spacing-lg)" }} aria-labelledby="todoist-create-task-title">
            <div className="aa-surface-header"><div><p className="aa-eyebrow">Ação rápida</p><h3 id="todoist-create-task-title">Criar tarefa no Todoist</h3></div></div>
            <div className="aa-planning-form-row">
              <div className="aa-field"><label htmlFor="todoist-task-content">Tarefa</label><input id="todoist-task-content" className="aa-input" value={newContent} onChange={(event) => setNewContent(event.target.value)} disabled={isCreating} placeholder="Ex.: Revisar capítulo 2" /></div>
              <div className="aa-field"><label htmlFor="todoist-task-due">Prazo</label><input id="todoist-task-due" className="aa-input" type="datetime-local" value={newDueAt} onChange={(event) => setNewDueAt(event.target.value)} disabled={isCreating} /></div>
              <button className="aa-button aa-button-primary" type="submit" disabled={isCreating || !newContent.trim()}><Plus size={16} aria-hidden="true" />{isCreating ? "Criando…" : "Criar"}</button>
            </div>
          </form>

          <div style={{ marginTop: "var(--aa-spacing-lg)" }}>
            <div className="aa-surface-header"><div><p className="aa-eyebrow">Próximas tarefas</p><h3 style={{ marginTop: 0 }}>Sua execução</h3></div><span className="aa-badge aa-badge-neutral">{tasks.length}</span></div>
            {tasks.length === 0 ? <div className="aa-empty"><p>Nenhuma tarefa ativa encontrada.</p></div> : (
              <ul className="aa-list">
                {tasks.map((task) => (
                  <li className="aa-list-item" key={task.id}>
                    <div><strong>{task.content}</strong>{task.due?.string ? <small><CalendarDays size={14} aria-hidden="true" /> {task.due.string}</small> : null}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      <button className="aa-button aa-button-secondary aa-button-sm" type="button" onClick={() => void completeTask(task.id)} disabled={busy}><CheckCircle2 size={16} aria-hidden="true" />Concluir</button>
                      <a className="aa-button aa-button-secondary aa-button-sm" href={`https://app.todoist.com/app/task/${encodeURIComponent(task.id)}`} target="_blank" rel="noreferrer" aria-label={`Abrir tarefa ${task.content} no Todoist`}><ExternalLink size={16} aria-hidden="true" />Abrir</a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "var(--aa-spacing-lg)" }}>
            <a className="aa-button aa-button-secondary" href="https://app.todoist.com/" target="_blank" rel="noreferrer">Abrir Todoist</a>
            <button type="button" className="aa-button aa-button-secondary" onClick={() => void disconnect()} disabled={busy || isCreating}><Unplug size={16} aria-hidden="true" />{busy ? "Desconectando…" : "Desconectar"}</button>
          </div>
        </>
      )}
      {error ? <p role="alert" className="aa-field-error">{error}</p> : null}
    </section>
  );
}