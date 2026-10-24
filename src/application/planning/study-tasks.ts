import type { StudyTask, StudyTaskRepository } from "@/domains/planning";

export type CreateStudyTaskInput = {
  ownerId: string;
  title: string;
  dueAt?: string | null;
};

export class StudyTaskService {
  constructor(private readonly repository: StudyTaskRepository) {}

  async create(input: CreateStudyTaskInput): Promise<StudyTask> {
    const title = input.title.trim();
    if (!title) throw new Error("O título da tarefa é obrigatório.");

    const dueAt = input.dueAt ?? null;
    if (dueAt !== null && !Number.isFinite(Date.parse(dueAt))) {
      throw new Error("Prazo da tarefa inválido.");
    }

    const now = new Date().toISOString();

    return this.repository.create({
      id: globalThis.crypto.randomUUID(),
      ownerId: input.ownerId,
      title,
      dueAt,
      status: "pending",
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  async listUpcoming(ownerId: string, now: string): Promise<StudyTask[]> {
    return this.repository.listUpcoming(ownerId, now);
  }
}
