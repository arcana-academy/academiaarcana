/**
 * Planning domain contracts.
 *
 * Planning owns executable study tasks and their lifecycle.
 * Completion is delegated to the atomic cross-domain reward boundary.
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
}
