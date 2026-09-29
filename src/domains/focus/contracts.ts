export type FocusSession = {
  readonly id: string;
  readonly ownerId: string;
  readonly durationSeconds: number;
  readonly startedAt: string;
  readonly completedAt: string | null;
};

export interface FocusSessionRepository {
  start(ownerId: string, durationSeconds: number, startedAt: string): Promise<FocusSession>;
  complete(ownerId: string, id: string, completedAt: string): Promise<FocusSession>;
}
