import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import {
  getTaskStatusLabel,
  getTaskStatusSymbol,
} from "@/domains/learning/tasks/state";
import type { TaskPriority, TaskStatus } from "@/domains/learning/tasks/types";

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

const STATUS_VARIANTS: Record<TaskStatus, string> = {
  todo: "neutral",
  in_progress: "info",
  done: "success",
  cancelled: "danger",
  scheduled: "warning",
  blocked: "danger",
  question: "info",
  idea: "neutral",
};

export interface TaskStateBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  status: TaskStatus;
  priority?: TaskPriority;
}

export function TaskStateBadge({ status, priority, className, ...props }: TaskStateBadgeProps) {
  const label = getTaskStatusLabel(status);
  const symbol = getTaskStatusSymbol(status);
  const priorityLabel = priority ? PRIORITY_LABELS[priority] : undefined;

  return (
    <span
      {...props}
      role="status"
      aria-label={priorityLabel ? `${label}. Prioridade: ${priorityLabel}` : label}
      className={cn("aa-badge", `aa-badge-${STATUS_VARIANTS[status]}`, className)}
    >
      <span aria-hidden="true">{symbol}</span>
      <span>{label}</span>
      {priorityLabel ? (
        <span className="aa-task-priority" aria-label={`Prioridade: ${priorityLabel}`}>
          {priorityLabel}
        </span>
      ) : null}
    </span>
  );
}
