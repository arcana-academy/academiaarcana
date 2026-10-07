"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_SECONDS = 25 * 60;

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

type FocusSessionProps = {
  startSession: (durationSeconds: number) => Promise<string>;
  completeSession: (sessionId: string) => Promise<void>;
};

export function FocusSession({ startSession, completeSession }: FocusSessionProps) {
  const [remaining, setRemaining] = useState(DEFAULT_SECONDS);
  const [running, setRunning] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const completionInFlight = useRef(false);

  const saveCompletedSession = useCallback(async (id: string) => {
    if (completionInFlight.current) return;
    completionInFlight.current = true;
    setSaving(true);
    try {
      await completeSession(id);
      setSessionId((current) => current === id ? null : current);
      setError(null);
    } catch (completionError) {
      setError(
        completionError instanceof Error
          ? completionError.message
          : "Não foi possível registrar a sessão.",
      );
    } finally {
      completionInFlight.current = false;
      setSaving(false);
    }
  }, [completeSession]);

  useEffect(() => {
    if (!running) return;
    if (deadline === null) return;

    const tick = () => {
      const nextRemaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(nextRemaining);
      if (nextRemaining === 0) {
        setRunning(false);
        setDeadline(null);
        if (sessionId) void saveCompletedSession(sessionId);
      }
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [deadline, running, saveCompletedSession, sessionId]);

  const progress = useMemo(
    () => ((DEFAULT_SECONDS - remaining) / DEFAULT_SECONDS) * 100,
    [remaining],
  );
  const completed = remaining === 0;

  function reset() {
    if (saving || sessionId) return;
    setRunning(false);
    setDeadline(null);
    setRemaining(DEFAULT_SECONDS);
    setError(null);
  }

  async function begin() {
    if (saving || sessionId) return;
    setError(null);
    setSaving(true);
    try {
      const id = await startSession(DEFAULT_SECONDS);
      setSessionId(id);
      setDeadline(Date.now() + DEFAULT_SECONDS * 1000);
      setRunning(true);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Não foi possível iniciar a sessão.");
    } finally {
      setSaving(false);
    }
  }

  const status = completed
    ? sessionId
      ? saving ? "Registrando" : "Registro pendente"
      : "Concluída"
    : running
      ? "Em andamento"
      : "Pausada";

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
        {error ? <p className="aa-field-error" role="alert">{error}</p> : null}
        {sessionId ? (
          <p id="focus-session-reset-help" className="aa-state-copy">
            Esta sessão já foi registrada. Pause ou retome o mesmo cronômetro; reiniciar fica disponível após a conclusão.
          </p>
        ) : null}
        <div className="aa-focus-session-actions">
          <button
            className="aa-button aa-button-primary"
            type="button"
            onClick={() => {
              if (saving) return;
              if (completed) {
                if (sessionId) {
                  void saveCompletedSession(sessionId);
                } else {
                  void begin();
                }
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
              void begin();
            }}
            disabled={saving}
            aria-label={
              running
                ? "Pausar sessão"
                : completed
                  ? sessionId ? "Tentar registrar sessão" : "Reiniciar sessão"
                  : sessionId ? "Retomar sessão" : "Iniciar sessão"
            }
          >
            {running ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
            {running
              ? "Pausar"
              : completed
                ? sessionId ? saving ? "Registrando…" : "Tentar registrar" : "Reiniciar"
                : sessionId ? "Retomar" : "Iniciar"}
          </button>
          <button
            className="aa-button aa-button-secondary"
            type="button"
            onClick={reset}
            disabled={saving || Boolean(sessionId)}
            aria-describedby={sessionId ? "focus-session-reset-help" : undefined}
          >
            <RotateCcw size={18} aria-hidden="true" />
            Reiniciar
          </button>
        </div>
      </div>
    </section>
  );
}
