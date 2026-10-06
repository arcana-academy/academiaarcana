/**
 * Sanctuary Domain Contracts
 * Following the canonical hierarchy and domain-driven design principles.
 */
import type {
  Chapter,
  Grimoire,
  Notebook,
  Page,
  PageProgressStatus,
} from "@/domains/learning";
import type { AdaptiveRecommendation } from "@/domains/adaptive";
import type { MissionStatus } from "@/domains/gamification";

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

/**
 * Minimal cross-domain projections consumed by Sanctuary.
 * They intentionally expose only the fields needed to assemble the read-side
 * Sanctuary view model; producer-domain ownership remains unchanged.
 */
export type SanctuaryProgressProjection = {
  pageId: string;
  status: PageProgressStatus;
};

export type SanctuaryTaskProjection = {
  id: string;
  title: string;
  dueAt: string | null;
};

export type SanctuaryMissionProjection = {
  id: string;
  title: string;
  rewardXp: number;
  status: MissionStatus;
};

/**
 * Consumer-owned read port for the Sanctuary aggregate.
 * Infrastructure adapters may compose producer repositories behind this port,
 * but Sanctuary never receives their concrete implementations.
 */
export interface SanctuaryProjectionPort {
  getLearningHierarchy(): Promise<SanctuaryGrimoire[]>;
  getPageProgress?(
    ownerId: string,
    pageIds: string[],
  ): Promise<SanctuaryProgressProjection[]>;
  listUpcomingStudyTasks?(
    ownerId: string,
    now: string,
    limit?: number,
  ): Promise<SanctuaryTaskProjection[]>;
  listDailyMissions?(
    ownerId: string,
    targetDate: string,
  ): Promise<SanctuaryMissionProjection[]>;
}

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
  intent: "explore" | "resume";
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
  adaptiveRecommendation: AdaptiveRecommendation;
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
  adaptiveRecommendation: AdaptiveRecommendation;
};
