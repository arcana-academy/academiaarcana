/**
 * Sanctuary Domain Contracts
 * Following the canonical hierarchy and domain-driven design principles.
 */

export type FeatureAvailability = "available" | "empty" | "not-configured";

export type SanctuaryPriority = "primary" | "secondary" | "supporting";

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
  progress: ProgressSummary | null;
  missions: SanctuaryMission[];
  schedule: ScheduleItem[];
  quickActions: QuickAction[];
};

export type SanctuaryViewModel = {
  header: {
    greeting: string;
    user: SanctuaryUser;
  };
  primaryAction: QuickAction;
  continueLearning: ContinueLearning | null;
  progress: ProgressSummary | null;
  missions: SanctuaryMission[];
  schedule: ScheduleItem[];
  quickActions: QuickAction[];
};
