"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, ExternalLink, Plus, RefreshCw, Unplug } from "lucide-react";

type AsanaTask = {
  id: string;
  name: string;
  completed?: boolean;
  dueOn?: string | null;
};

type AsanaStatus =
  | { status: "disconnected" }
  | { status: "connected"; user?: { name?: string; email?: string }; verifiedAt?: string }
  | { status: "reauthorization_required" };

export function AsanaConnectionPanel() {
  const [status, setStatus] = useState<AsanaStatus>({ status: "disconnected" });
  const [tasks, setTasks] = useState<AsanaTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDueOn, setNewDueOn] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/asana/status", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const next = (await response.json()) as AsanaStatus;
      setStatus(next);
      if (next.status === "connected") {
        const tasksResponse = await fetch("/api/integrations/asana/tasks", { cache: "no-store" });
        if (!tasksResponse.ok) throw new Error();
        const data = (await tasksResponse.json()) as { tasks?: AsanaTask[] };
        setTasks(data.tasks?.filter((task) => !task.completed).slice(0, 8) ?? []);
      } else {
        setTasks([]);
      }
    } catch {
      setError("Não foi possível consultar o estado do Asana.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadInitial = async () => {
      try {
        const response = await fetch("/api/integrations/asana/status", { cache: "no-store" });
        if (!response.ok) throw new Error();
        const next = (await response.json()) as AsanaStatus;

        if (next.status === "connected") {
          const tasksResponse = await fetch("/api/integrations/asana/tasks", { cache: "no-store" });
          if (!tasksResponse.ok) throw new Error();
          const data = (await tasksResponse.json()) as { tasks?: AsanaTask[] };

          if (!cancelled) {
            setStatus(next);
            setTasks(data.tasks?.filter((task) => !task.completed).slice(0, 8) ?? []);
          }
        } else if (!cancelled) {
          setStatus(next);
          setTasks([]);
        }
      } catch {
        if (!cancelled) setError("Não foi possível consultar o estado do Asana.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadInitial();

    return () => {
      cancelled = true;
    };
  }, []);

  const disconnect = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/integrations/asana/disconnect", { method: "POST" });
      if (!response.ok) throw new Error();
      setStatus({ status: "disconnected" });
      setTasks([]);
    } catch {
      setError("Não foi possível desconectar o Asana.");
    } finally {
      setBusy(false);
    }
  };

  const createTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/asana/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), dueOn: newDueOn || undefined }),
      });
      const body = (await response.json().catch(() => null)) as { task?: AsanaTask } | null;
      if (!response.ok || !body?.task) throw new Error();
      setTasks((current) => [body.task!, ...current].slice(0, 8));
      setNewName("");
      setNewDueOn("");
    } catch {
      setError("Não foi possível criar a tarefa no Asana.");
    } finally {
      setBusy(false);
    }
  };

  const completeTask = async (taskId: string) => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/asana/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      if (!response.ok) throw new Error();
      setTasks((current) => current.filter((task) => task.id !== taskId));
    } catch {
      setError("Não foi possível concluir a tarefa no Asana.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <section className="aa-surface" aria-busy="true"><p>Consultando conexão do Asana…</p></section>;
  }

  return (
    <section className="aa-surface" aria-labelledby="asana-connection-title">
      <div className="aa-surface-header">
        <div><p className="aa-eyebrow">Produtividade · planejamento</p><h2 id="asana-connection-title">Asana</h2></div>
        <button type="button" className="aa-button aa-button-secondary aa-button-sm" onClick={() => void load()} disabled={busy}>
          <RefreshCw size={16} aria-hidden="true" />Atualizar
        </button>
      </div>

      {status.status === "disconnected" || status.status === "reauthorization_required" ? (
        <div className="aa-empty">
          <p>{status.status === "disconnected" ? "Conecte sua conta para enviar tarefas de estudo ao Asana." : "A autorização do Asana precisa ser refeita."}</p>
          <a className="aa-button aa-button-primary" href="/api/integrations/asana/connect">
            {status.status === "disconnected" ? "Conectar Asana" : "Reconectar Asana"}
          </a>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
            <CheckCircle2 size={18} aria-hidden="true" /><strong>Conectado</strong>
            {status.user?.name ? <span>{status.user.name}</span> : null}
          </div>
          {status.user?.email ? <p className="aa-state-copy">Conta: {status.user.email}</p> : null}

          <form onSubmit={createTask} className="aa-planning-form" style={{ marginTop: "var(--aa-spacing-lg)" }}>
            <div className="aa-surface-header"><div><p className="aa-eyebrow">Ação rápida</p><h3>Criar tarefa no Asana</h3></div></div>
            <div className="aa-planning-form-row">
              <div className="aa-field"><label htmlFor="asana-task-name">Tarefa</label><input id="asana-task-name" className="aa-input" value={newName} onChange={(event) => setNewName(event.target.value)} disabled={busy} placeholder="Ex.: Revisar capítulo 2" /></div>
              <div className="aa-field"><label htmlFor="asana-task-due">Prazo</label><input id="asana-task-due" className="aa-input" type="date" value={newDueOn} onChange={(event) => setNewDueOn(event.target.value)} disabled={busy} /></div>
              <button className="aa-button aa-button-primary" type="submit" disabled={busy || !newName.trim()}><Plus size={16} aria-hidden="true" />Criar</button>
            </div>
          </form>

          <div style={{ marginTop: "var(--aa-spacing-lg)" }}>
            <div className="aa-surface-header"><div><p className="aa-eyebrow">Tarefas ativas</p><h3 style={{ marginTop: 0 }}>Sua execução</h3></div><span className="aa-badge aa-badge-neutral">{tasks.length}</span></div>
            {tasks.length === 0 ? <div className="aa-empty"><p>Nenhuma tarefa ativa encontrada.</p></div> : (
              <ul className="aa-list">
                {tasks.map((task) => (
                  <li className="aa-list-item" key={task.id}>
                    <div><strong>{task.name}</strong>{task.dueOn ? <small>Prazo: {task.dueOn}</small> : null}</div>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <button className="aa-button aa-button-secondary aa-button-sm" type="button" onClick={() => void completeTask(task.id)} disabled={busy}><CheckCircle2 size={16} aria-hidden="true" />Concluir</button>
                      <a className="aa-button aa-button-secondary aa-button-sm" href={`https://app.asana.com/0/0/${encodeURIComponent(task.id)}`} target="_blank" rel="noreferrer" aria-label={`Abrir tarefa ${task.name} no Asana`}><ExternalLink size={16} aria-hidden="true" />Abrir</a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "var(--aa-spacing-lg)" }}>
            <a className="aa-button aa-button-secondary" href="https://app.asana.com/" target="_blank" rel="noreferrer">Abrir Asana</a>
            <button type="button" className="aa-button aa-button-secondary" onClick={() => void disconnect()} disabled={busy}><Unplug size={16} aria-hidden="true" />Desconectar</button>
          </div>
        </>
      )}
      {error ? <p role="alert" className="aa-field-error">{error}</p> : null}
    </section>
  );
}
