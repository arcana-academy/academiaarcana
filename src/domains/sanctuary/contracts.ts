/**
 * Sanctuary Domain Contracts
 * Following the canonical hierarchy and domain-driven design principles.
 */
import type { Grimoire, Notebook, Chapter, Page } from "@/domains/learning";

export type SanctuaryPage = Pick<Page, "id" | "chapterId" | "title" | "position">;

export type SanctuaryChapter = Pick<Chapter, "id" | "notebookId" | "title" | "position"> & {
  pages: SanctuaryPage[];
};

export type SanctuaryNotebook = Pick<Notebook, "id" | "grimoireId" | "title" | "position"> & {
  chapters: SanctuaryChapter[];
};

export type SanctuaryGrimoire = Pick<Grimoire, "id" | "ownerId" | "title" | "icon" | "cover"> & {
  notebooks: SanctuaryNotebook[];
};

export type FeatureAvailability = "available" | "empty" | "not-configured";

export type SanctuaryPriority = "primary" | "secondary" | "supporting";

export type SanctuarySection =
  | "continueLearning"
  | "progress"
  | "missions"
  | "schedule"
  | "quickActions";

export type PriorityDecision = {
  section: SanctuarySection;
  priority: SanctuaryPriority;
  reason: string;
};

export type SectionState<T> =
  | { status: "ready"; data: T }
  | { status: "empty"; data: null }
  | { status: "not-configured"; data: null }
  | { status: "error"; data: null; message: string };

export type SanctuaryUser = {
  id: string;
  displayName?: string;
  avatarUrl?: string;
};

export type ContinueLearning = {
  grimoireId: string;
  grimoireTitle: string;
  notebookId?: string;
  notebookTitle?: string;
  chapterId?: string;
  chapterTitle?: string;
  pageId?: string;
  pageTitle?: string;
  href: string;
};

export type ContinueLearningContext = Omit<ContinueLearning, "href">;

export type ProgressSummary = {
  percentage: number;
  label: string;
};

export type SanctuaryMission = {
  id: string;
  title: string;
  reward: string;
  isCompleted: boolean;
};

export type ScheduleItem = {
  id: string;
  time: string;
  title: string;
  location?: string;
};

export type QuickAction = {
  id: string;
  label: string;
  icon?: string;
  href: string;
  priority: SanctuaryPriority;
};

export type SanctuarySnapshot = {
  user: SanctuaryUser;
  continueLearning: ContinueLearning | null;
  progress: SectionState<ProgressSummary>;
  missions: SectionState<SanctuaryMission[]>;
  schedule: SectionState<ScheduleItem[]>;
  quickActions: QuickAction[];
};

export type SanctuaryViewModel = {
  header: {
    greeting: string;
    user: SanctuaryUser;
  };
  primaryAction: QuickAction;
  continueLearning: ContinueLearning | null;
  progress: SectionState<ProgressSummary>;
  missions: SectionState<SanctuaryMission[]>;
  schedule: SectionState<ScheduleItem[]>;
  quickActions: QuickAction[];
};
