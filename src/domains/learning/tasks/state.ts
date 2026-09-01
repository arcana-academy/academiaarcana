import type { TaskStatus } from "./types";

const LABELS: Record<TaskStatus, string> = {
  todo: "A fazer",
  in_progress: "Em andamento",
  done: "Concluída",
  cancelled: "Cancelada",
  scheduled: "Agendada",
  blocked: "Bloqueada",
  question: "Pergunta",
  idea: "Ideia",
};

const SYMBOLS: Record<TaskStatus, string> = {
  todo: "□",
  in_progress: "◐",
  done: "✓",
  cancelled: "—",
  scheduled: "◷",
  blocked: "⊘",
  question: "?",
  idea: "✦",
};

const TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  todo: ["in_progress", "scheduled", "blocked", "cancelled", "question", "idea"],
  in_progress: ["done", "todo", "blocked", "cancelled", "question", "idea"],
  done: ["todo", "in_progress", "cancelled"],
  cancelled: ["todo", "in_progress"],
  scheduled: ["todo", "in_progress", "blocked", "cancelled"],
  blocked: ["todo", "in_progress", "cancelled"],
  question: ["todo", "in_progress", "cancelled", "idea"],
  idea: ["todo", "in_progress", "question", "cancelled"],
};

export function getTaskStatusLabel(status: TaskStatus): string {
  return LABELS[status];
}

export function getTaskStatusSymbol(status: TaskStatus): string {
  return SYMBOLS[status];
}

export function canTransitionTaskStatus(from: TaskStatus, to: TaskStatus): boolean {
  return from === to || TRANSITIONS[from].includes(to);
}
