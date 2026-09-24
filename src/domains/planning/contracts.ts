/**
 * Planning domain contracts.
 *
 * Planning owns executable study tasks and their lifecycle.
 */

export type StudyTaskStatus = "pending" | "completed" | "cancelled";

export type StudyTask = {
  id: string;
  ownerId: string;
  title: string;
  dueAt: string | null;
  status: StudyTaskStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export interface StudyTaskRepository {
  create(task: StudyTask): Promise<StudyTask>;
  listUpcoming(ownerId: string, now: string, limit?: number): Promise<StudyTask[]>;
  getById(id: string): Promise<StudyTask | null>;
  complete(id: string, completedAt: string): Promise<StudyTask | null>;
}
