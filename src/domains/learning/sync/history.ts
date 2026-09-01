import type { DocumentVersion } from "./types";

export function createVersion(input: Omit<DocumentVersion, "version">, previous: readonly DocumentVersion[]): DocumentVersion {
  const nextVersion = previous.reduce((max, item) => Math.max(max, item.version), 0) + 1;
  return { ...input, version: nextVersion };
}

export function getLatestVersion(versions: readonly DocumentVersion[]): DocumentVersion | undefined {
  return [...versions].sort((a, b) => b.version - a.version)[0];
}

export function getVersionDiff(left: string, right: string): { changed: boolean; added: number; removed: number } {
  if (left === right) return { changed: false, added: 0, removed: 0 };
  const a = left.split(/\r?\n/);
  const b = right.split(/\r?\n/);
  const common = Math.min(a.length, b.length);
  let changed = 0;
  for (let index = 0; index < common; index += 1) {
    if (a[index] !== b[index]) changed += 1;
  }
  return {
    changed: true,
    added: Math.max(0, b.length - common) + changed,
    removed: Math.max(0, a.length - common) + changed,
  };
}

export function restoreVersion(version: DocumentVersion, restoredAt: string, restoredBy: string, previous: readonly DocumentVersion[]): DocumentVersion {
  return createVersion(
    {
      id: crypto.randomUUID(),
      documentId: version.documentId,
      content: version.content,
      createdAt: restoredAt,
      createdBy: restoredBy,
      changeSummary: `Restaurada a versão ${version.version}`,
      deleted: false,
    },
    previous,
  );
}
