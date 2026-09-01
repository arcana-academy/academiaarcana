import type { DocumentVersion, SyncOperation } from "@/domains/learning/sync";

export interface LearningBackup {
  format: "academia-arcana-learning-backup";
  version: 1;
  createdAt: string;
  versions: DocumentVersion[];
  pendingOperations: SyncOperation[];
}

export function createBackup(input: { versions: readonly DocumentVersion[]; pendingOperations: readonly SyncOperation[]; createdAt: string }): LearningBackup {
  return { format: "academia-arcana-learning-backup", version: 1, createdAt: input.createdAt, versions: [...input.versions], pendingOperations: [...input.pendingOperations] };
}

export function parseBackup(raw: string): LearningBackup {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") throw new Error("Backup inválido.");
  const candidate = parsed as Partial<LearningBackup>;
  if (candidate.format !== "academia-arcana-learning-backup" || candidate.version !== 1 || !Array.isArray(candidate.versions) || !Array.isArray(candidate.pendingOperations)) {
    throw new Error("Formato de backup não reconhecido.");
  }
  return candidate as LearningBackup;
}
