import type { TaskPriority, TaskStatus, LearningTask } from "../tasks/types";

export type LearningDocumentType = "note" | "chapter" | "reference" | "resource" | "template";

export type LearningViewKind = "list" | "board" | "cards" | "table";

export interface LearningProperty {
  id: string;
  key: string;
  label: string;
  type: "text" | "date" | "number" | "checkbox" | "select" | "link" | "tag";
  value?: string | number | boolean | string[];
}

export interface LearningLink {
  targetId: string;
  label?: string;
  kind: "internal" | "external" | "mention" | "backlink";
}

export interface LearningDocument {
  id: string;
  title: string;
  type: LearningDocumentType;
  excerpt?: string;
  updatedAt: string;
  properties: LearningProperty[];
  links: LearningLink[];
  tasks: LearningTask[];
}

export interface LearningViewConfig {
  id: string;
  name: string;
  kind: LearningViewKind;
  groupBy?: "status" | "priority" | "type";
  filterStatus?: TaskStatus[];
  filterPriority?: TaskPriority[];
}
