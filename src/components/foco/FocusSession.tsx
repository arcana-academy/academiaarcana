"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const DEFAULT_SECONDS = 25 * 60;

type FocusSessionProps = {
  onStart: (durationSeconds: number) => Promise<{ id: string }>;
  onComplete: (id: string) => Promise<unknown>;
};

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function FocusSession({ onStart, onComplete }: FocusSessionProps) {
  const [remaining, setRemaining] = useState(DEFAULT_SECONDS);
  const [running, setRunning] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!running || deadline === null) return;

    const tick = () => {
      const nextRemaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(nextRemaining);
      if (nextRemaining === 0) {
        setRunning(false);
        setDeadline(null);
        if (sessionId) {
          setBusy(true);
          void onComplete(sessionId)
            .catch(() => setError("A sessão terminou, mas não foi possível registrar a conclusão."))
            .finally(() => setBusy(false));
        }
      }
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [deadline, onComplete, running, sessionId]);

  const progress = useMemo(
    () => ((DEFAULT_SECONDS - remaining) / DEFAULT_SECONDS) * 100,
    [remaining],
  );
  const completed = remaining === 0;
  const status = completed ? "Concluída" : running ? "Em andamento" : "Pausada";

  async function start() {
    setError(null);
    setBusy(true);
    try {
      const session = await onStart(DEFAULT_SECONDS);
      setSessionId(session.id);
      setDeadline(Date.now() + remaining * 1000);
      setRunning(true);
    } catch {
      setError("Não foi possível iniciar a sessão. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setRunning(false);
    setDeadline(null);
    setRemaining(DEFAULT_SECONDS);
    setSessionId(null);
    setError(null);
  }

  async function toggle() {
    if (completed) {
      reset();
      await start();
      return;
    }
    if (running) {
      setRunning(false);
      setDeadline(null);
      return;
    }
    if (sessionId) {
      setDeadline(Date.now() + remaining * 1000);
      setRunning(true);
      return;
    }
    await start();
  }

  return (
    <section className="aa-focus-session" aria-labelledby="focus-session-title">
      <div className="aa-surface aa-focus-session-card">
        <div className="aa-surface-header">
          <div>
            <p className="aa-eyebrow">Sessão guiada</p>
            <h2 id="focus-session-title">25 minutos de foco</h2>
            <p>O início e a conclusão são registrados para que o progresso possa alimentar estatísticas reais.</p>
          </div>
          <span className="aa-badge aa-badge-info" aria-live="polite">{status}</span>
        </div>
        <div className="aa-focus-timer">
          <span>{formatTime(remaining)}</span>
        </div>
        <div
          className="aa-progress-track"
          role="progressbar"
          aria-label="Progresso da sessão de foco"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div className="aa-progress-value" style={{ width: `${progress}%` }} />
        </div>
        {error ? <p role="alert" className="aa-field-error">{error}</p> : null}
        <div className="aa-focus-session-actions">
          <button
            className="aa-button aa-button-primary"
            type="button"
            disabled={busy}
            onClick={() => { void toggle(); }}
            aria-label={running ? "Pausar sessão" : completed ? "Reiniciar sessão" : "Iniciar sessão"}
          >
            {running ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
            {busy ? "Registrando..." : running ? "Pausar" : completed ? "Reiniciar" : "Iniciar"}
          </button>
          <button className="aa-button aa-button-secondary" type="button" onClick={reset} disabled={busy}>
            <RotateCcw size={18} aria-hidden="true" />
            Reiniciar
          </button>
        </div>
      </div>
    </section>
  );
}
