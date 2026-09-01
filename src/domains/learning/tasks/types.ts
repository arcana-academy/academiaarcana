export type TaskStatus =
  | "todo"
  | "in_progress"
  | "done"
  | "cancelled"
  | "scheduled"
  | "blocked"
  | "question"
  | "idea";

export type TaskPriority = "low" | "normal" | "high" | "urgent";

export interface LearningTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
}
