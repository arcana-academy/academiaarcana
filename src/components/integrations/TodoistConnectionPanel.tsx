"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, ExternalLink, RefreshCw, Unplug } from "lucide-react";

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

type TodoistData = {
  status: "connected";
  tasks: TodoistTask[];
};

export function TodoistConnectionPanel() {
  const [status, setStatus] = useState<TodoistStatus>({ status: "disconnected" });
  const [tasks, setTasks] = useState<TodoistTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/integrations/todoist/status", {
        cache: "no-store",
      });

      if (!response.ok) throw new Error();
      const nextStatus = (await response.json()) as TodoistStatus;
      setStatus(nextStatus);

      if (nextStatus.status === "connected") {
        const tasksResponse = await fetch("/api/integrations/todoist/tasks", {
          cache: "no-store",
        });
        if (tasksResponse.ok) {
          const data = (await tasksResponse.json()) as TodoistData;
          if (data.status === "connected") setTasks(data.tasks.slice(0, 8));
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
    void load();
  }, []);

  const disconnect = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/todoist/disconnect", {
        method: "POST",
      });
      if (!response.ok) throw new Error();
      setStatus({ status: "disconnected" });
      setTasks([]);
    } catch {
      setError("Não foi possível desconectar o Todoist.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <section className="aa-surface" aria-busy="true"><p>Consultando conexão do Todoist…</p></section>;
  }

  return (
    <section className="aa-surface" aria-labelledby="todoist-connection-title">
      <div className="aa-surface-header">
        <div>
          <p className="aa-eyebrow">Produtividade</p>
          <h2 id="todoist-connection-title">Lista de tarefas</h2>
        </div>
        <button
          type="button"
          className="aa-button aa-button-secondary aa-button-sm"
          onClick={() => void load()}
          disabled={busy}
        >
          <RefreshCw size={16} aria-hidden="true" />
          Atualizar
        </button>
      </div>

      {status.status === "disconnected" ? (
        <div className="aa-empty">
          <p>O Todoist ainda não está conectado a esta conta da Academia Arcana.</p>
          <a
            className="aa-button aa-button-primary"
            href="/api/integrations/todoist/connect"
          >
            Conectar Todoist
          </a>
        </div>
      ) : status.status === "reauthorization_required" ? (
        <div className="aa-empty">
          <p>A autorização do Todoist precisa ser refeita.</p>
          <a
            className="aa-button aa-button-primary"
            href="/api/integrations/todoist/connect"
          >
            Reconectar Todoist
          </a>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gap: "var(--aa-spacing-sm)" }}>
            <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
              <CheckCircle2 size={18} aria-hidden="true" />
              <strong>Conectado</strong>
              {status.user?.fullName ? <span>{status.user.fullName}</span> : null}
            </div>
            {status.user?.email ? (
              <p className="aa-state-copy" style={{ margin: 0 }}>
                Conta: {status.user.email}
              </p>
            ) : null}
          </div>

          <div style={{ marginTop: "var(--aa-spacing-md)" }}>
            <div className="aa-surface-header">
              <div>
                <p className="aa-eyebrow">Próximas tarefas</p>
                <h3 style={{ marginTop: 0 }}>Todoist</h3>
              </div>
            </div>

            {tasks.length === 0 ? (
              <div className="aa-empty"><p>Nenhuma tarefa ativa encontrada.</p></div>
            ) : (
              <ul className="aa-list">
                {tasks.map((task) => (
                  <li className="aa-list-item" key={task.id}>
                    <div>
                      <strong>{task.content}</strong>
                      {task.due?.string ? (
                        <small>
                          <CalendarDays size={14} aria-hidden="true" /> {task.due.string}
                        </small>
                      ) : null}
                    </div>
                    <a
                      className="aa-button aa-button-secondary aa-button-sm"
                      href={`https://app.todoist.com/app/task/${encodeURIComponent(task.id)}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Abrir tarefa ${task.content} no Todoist`}
                    >
                      <ExternalLink size={16} aria-hidden="true" />
                      Abrir
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "var(--aa-spacing-lg)" }}>
            <a className="aa-button aa-button-secondary" href="https://app.todoist.com/" target="_blank" rel="noreferrer">
              Abrir Todoist
            </a>
            <button
              type="button"
              className="aa-button aa-button-secondary"
              onClick={() => void disconnect()}
              disabled={busy}
            >
              <Unplug size={16} aria-hidden="true" />
              {busy ? "Desconectando…" : "Desconectar"}
            </button>
          </div>
        </>
      )}

      {error ? <p role="alert" className="aa-field-error">{error}</p> : null}
    </section>
  );
}
