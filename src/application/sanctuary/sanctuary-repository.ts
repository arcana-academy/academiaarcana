import type { SanctuaryGrimoire } from "@/domains/sanctuary";

export type SanctuaryProgressProjection = {
  pageId: string;
  status: "not-started" | "in-progress" | "completed";
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
  status: "open" | "completed";
};

export interface SanctuaryRepository {
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
