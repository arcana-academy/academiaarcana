import { describe, expect, it } from "vitest";
import { applyLearningView, groupLearningDocuments } from "./views";
import type { LearningDocument } from "./types";

const documents: LearningDocument[] = [
  {
    id: "doc-1",
    title: "Anatomia",
    type: "note",
    updatedAt: "2026-09-01T10:00:00Z",
    properties: [],
    links: [],
    tasks: [{ id: "task-1", title: "Revisar", status: "todo", priority: "high" }],
  },
  {
    id: "doc-2",
    title: "Fisiologia",
    type: "chapter",
    updatedAt: "2026-09-01T11:00:00Z",
    properties: [],
    links: [],
    tasks: [{ id: "task-2", title: "Estudar", status: "in_progress", priority: "normal" }],
  },
];

describe("learning workspace views", () => {
  it("filters documents by task status and priority", () => {
    expect(applyLearningView(documents, { id: "v", name: "A fazer", kind: "list", filterStatus: ["todo"] })).toHaveLength(1);
    expect(applyLearningView(documents, { id: "v", name: "Alta", kind: "list", filterPriority: ["high"] })).toHaveLength(1);
  });

  it("groups documents by a semantic property", () => {
    const grouped = groupLearningDocuments(documents, { id: "v", name: "Tipos", kind: "cards", groupBy: "type" });
    expect(grouped.note).toHaveLength(1);
    expect(grouped.chapter).toHaveLength(1);
  });
});
