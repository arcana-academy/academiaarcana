import type { FocusSession, FocusSessionRepository } from "@/domains/planning";

const MIN_DURATION_SECONDS = 60;
const MAX_DURATION_SECONDS = 4 * 60 * 60;

export type StartFocusSessionInput = {
  ownerId: string;
  durationSeconds: number;
};

export class FocusSessionService {
  constructor(private readonly repository: FocusSessionRepository) {}

  async start(input: StartFocusSessionInput): Promise<string> {
    if (
      !Number.isInteger(input.durationSeconds) ||
      input.durationSeconds < MIN_DURATION_SECONDS ||
      input.durationSeconds > MAX_DURATION_SECONDS
    ) {
      throw new Error("Duração da sessão de foco inválida.");
    }

    const now = new Date().toISOString();
    const session: FocusSession = {
      id: globalThis.crypto.randomUUID(),
      ownerId: input.ownerId,
      durationSeconds: input.durationSeconds,
      startedAt: now,
      completedAt: null,
      createdAt: now,
    };

    return this.repository.start(session);
  }

  async complete(ownerId: string, sessionId: string): Promise<void> {
    if (!sessionId.trim()) {
      throw new Error("Sessão de foco inválida.");
    }

    await this.repository.complete(
      ownerId,
      sessionId,
      new Date().toISOString(),
    );
  }
}
