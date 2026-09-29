"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const DEFAULT_SECONDS = 25 * 60;

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function FocusSession() {
  const [remaining, setRemaining] = useState(DEFAULT_SECONDS);
  const [running, setRunning] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);

  useEffect(() => {
    if (!running) return;

    if (deadline === null) return;

    const tick = () => {
      const nextRemaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(nextRemaining);
      if (nextRemaining === 0) {
        setRunning(false);
        setDeadline(null);
      }
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [deadline, running]);

  const progress = useMemo(
    () => ((DEFAULT_SECONDS - remaining) / DEFAULT_SECONDS) * 100,
    [remaining],
  );
  const completed = remaining === 0;

  function reset() {
    setRunning(false);
    setDeadline(null);
    setRemaining(DEFAULT_SECONDS);
  }

  const status = completed ? "Concluída" : running ? "Em andamento" : "Pausada";

  return (
    <section className="aa-focus-session" aria-labelledby="focus-session-title">
      <div className="aa-surface aa-focus-session-card">
        <div className="aa-surface-header">
          <div>
            <p className="aa-eyebrow">Sessão guiada</p>
            <h2 id="focus-session-title">25 minutos de foco</h2>
            <p>Um temporizador local, previsível e sem pressão artificial.</p>
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
        <div className="aa-focus-session-actions">
          <button
            className="aa-button aa-button-primary"
            type="button"
            onClick={() => {
              if (completed) {
                setRemaining(DEFAULT_SECONDS);
                setDeadline(Date.now() + DEFAULT_SECONDS * 1000);
                setRunning(true);
                return;
              }
              if (running) {
                setRunning(false);
                setDeadline(null);
                return;
              }
              setDeadline(Date.now() + remaining * 1000);
              setRunning(true);
            }}
            aria-label={running ? "Pausar sessão" : completed ? "Reiniciar sessão" : "Iniciar sessão"}
          >
            {running ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
            {running ? "Pausar" : completed ? "Reiniciar" : "Iniciar"}
          </button>
          <button className="aa-button aa-button-secondary" type="button" onClick={reset}>
            <RotateCcw size={18} aria-hidden="true" />
            Reiniciar
          </button>
        </div>
      </div>
    </section>
  );
}
