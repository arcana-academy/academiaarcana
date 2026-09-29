"use client";

import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;
const STORAGE_KEY = "academia-arcana.focus-session.v1";

type FocusMode = "focus" | "break";
type PersistedState = {
  mode: FocusMode;
  remaining: number;
  running: boolean;
  deadline: number | null;
  completedFocusSessions: number;
};

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function durationFor(mode: FocusMode) {
  return mode === "focus" ? FOCUS_SECONDS : BREAK_SECONDS;
}

function readPersistedState(): PersistedState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (
      (parsed.mode !== "focus" && parsed.mode !== "break") ||
      typeof parsed.remaining !== "number" ||
      typeof parsed.completedFocusSessions !== "number"
    ) {
      return null;
    }

    const remaining = Math.max(0, Math.min(durationFor(parsed.mode), Math.floor(parsed.remaining)));
    const running = parsed.running === true && typeof parsed.deadline === "number";
    return {
      mode: parsed.mode,
      remaining,
      running,
      deadline: running ? parsed.deadline ?? null : null,
      completedFocusSessions: Math.max(0, Math.floor(parsed.completedFocusSessions)),
    };
  } catch {
    return null;
  }
}

export function FocusSession() {
  const [mode, setMode] = useState<FocusMode>("focus");
  const [remaining, setRemaining] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persisted = readPersistedState();
    if (persisted) {
      setMode(persisted.mode);
      setRemaining(persisted.remaining);
      setRunning(persisted.running);
      setDeadline(persisted.running ? persisted.deadline : null);
      setCompletedFocusSessions(persisted.completedFocusSessions);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const snapshot: PersistedState = {
      mode,
      remaining,
      running,
      deadline,
      completedFocusSessions,
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Local persistence is an enhancement; the timer remains functional without it.
    }
  }, [completedFocusSessions, deadline, hydrated, mode, remaining, running]);

  useEffect(() => {
    if (!running || deadline === null) return;

    const tick = () => {
      const nextRemaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(nextRemaining);

      if (nextRemaining === 0) {
        setRunning(false);
        setDeadline(null);

        if (mode === "focus") {
          setCompletedFocusSessions((current) => current + 1);
          setMode("break");
          setRemaining(BREAK_SECONDS);
        } else {
          setMode("focus");
          setRemaining(FOCUS_SECONDS);
        }
      }
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [deadline, mode, running]);

  const totalSeconds = durationFor(mode);
  const progress = useMemo(
    () => ((totalSeconds - remaining) / totalSeconds) * 100,
    [remaining, totalSeconds],
  );
  const completed = remaining === 0;
  const label = mode === "focus" ? "Foco" : "Pausa";
  const status = completed ? "Concluída" : running ? "Em andamento" : "Pausada";

  function startOrPause() {
    if (running) {
      setRunning(false);
      setDeadline(null);
      return;
    }

    const nextRemaining = completed ? totalSeconds : remaining;
    setRemaining(nextRemaining);
    setDeadline(Date.now() + nextRemaining * 1000);
    setRunning(true);
  }

  function reset() {
    setRunning(false);
    setDeadline(null);
    setMode("focus");
    setRemaining(FOCUS_SECONDS);
  }

  function skipMode() {
    setRunning(false);
    setDeadline(null);
    if (mode === "focus") {
      setCompletedFocusSessions((current) => current + 1);
      setMode("break");
      setRemaining(BREAK_SECONDS);
    } else {
      setMode("focus");
      setRemaining(FOCUS_SECONDS);
    }
  }

  return (
    <section className="aa-focus-session" aria-labelledby="focus-session-title">
      <div className="aa-surface aa-focus-session-card">
        <div className="aa-surface-header">
          <div>
            <p className="aa-eyebrow">Pomodoro · {label}</p>
            <h2 id="focus-session-title">{mode === "focus" ? "25 minutos de foco" : "5 minutos de pausa"}</h2>
            <p>Um ciclo previsível, com recuperação local após recarregar a página.</p>
          </div>
          <span className="aa-badge aa-badge-info" aria-live="polite">{status}</span>
        </div>

        <div className="aa-focus-timer" aria-label={`${label}: ${formatTime(remaining)}`}>
          <span>{formatTime(remaining)}</span>
        </div>

        <div
          className="aa-progress-track"
          role="progressbar"
          aria-label={`Progresso da ${label.toLowerCase()}`}
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
            onClick={startOrPause}
            aria-label={running ? "Pausar sessão" : completed ? `Reiniciar ${label.toLowerCase()}` : `Iniciar ${label.toLowerCase()}`}
          >
            {running ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
            {running ? "Pausar" : completed ? "Reiniciar" : "Iniciar"}
          </button>
          <button className="aa-button aa-button-secondary" type="button" onClick={skipMode}>
            <SkipForward size={18} aria-hidden="true" />
            {mode === "focus" ? "Ir para pausa" : "Voltar ao foco"}
          </button>
          <button className="aa-button aa-button-ghost" type="button" onClick={reset}>
            <RotateCcw size={18} aria-hidden="true" />
            Reiniciar ciclo
          </button>
        </div>

        <p className="aa-state-copy" aria-live="polite">
          Sessões de foco concluídas neste ciclo: {completedFocusSessions}.
        </p>
      </div>
    </section>
  );
}
