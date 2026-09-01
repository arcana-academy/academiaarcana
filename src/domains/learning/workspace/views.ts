import type { LearningDocument, LearningViewConfig } from "./types";

export function applyLearningView(
  documents: readonly LearningDocument[],
  view: LearningViewConfig,
): LearningDocument[] {
  return documents.filter((document) => {
    const statusMatch =
      !view.filterStatus?.length ||
      document.tasks.some((task) => view.filterStatus?.includes(task.status));
    const priorityMatch =
      !view.filterPriority?.length ||
      document.tasks.some((task) => view.filterPriority?.includes(task.priority));
    return statusMatch && priorityMatch;
  });
}

export function groupLearningDocuments(
  documents: readonly LearningDocument[],
  view: LearningViewConfig,
): Record<string, LearningDocument[]> {
  if (!view.groupBy) return { all: [...documents] };

  return documents.reduce<Record<string, LearningDocument[]>>((groups, document) => {
    const keys =
      view.groupBy === "type"
        ? [document.type]
        : view.groupBy === "status"
          ? [...new Set(document.tasks.map((task) => task.status))]
          : [...new Set(document.tasks.map((task) => task.priority))];

    for (const key of keys) {
      groups[key] ??= [];
      groups[key].push(document);
    }

    return groups;
  }, {});
}
