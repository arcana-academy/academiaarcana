/** Public contracts owned by the intelligence domain. */

export type MestreArcanoExecution = {
  readonly output: string;
  readonly responseId: string | null;
  readonly model: string;
};

export type MestreArcanoGateway = {
  execute(input: string): Promise<MestreArcanoExecution>;
};

export type MestreArcanoGamificationProfile = {
  readonly xp: number;
  readonly streakDays: number;
  readonly lastActiveOn: string | null;
  readonly updatedAt: string | null;
};

export type MestreArcanoMission = {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly rewardXp: number;
  readonly targetDate: string;
  readonly completed: boolean;
  readonly completedAt: string | null;
};

export type MestreArcanoStudyTask = {
  readonly id: string;
  readonly title: string;
  readonly dueAt: string | null;
  readonly status: string;
  readonly completedAt: string | null;
};

export type MestreArcanoSharePointSource = {
  readonly sourceId: string;
  readonly name: string;
  readonly mimeType: string | null;
  readonly webUrl: string | null;
  readonly lastModifiedAt: string | null;
  readonly sizeBytes: number | null;
  readonly status: string;
};

export type MestreArcanoContextProvider = {
  getGamificationProfile(): Promise<MestreArcanoGamificationProfile>;
  getTodayMissions(): Promise<MestreArcanoMission[]>;
  getUpcomingStudyTasks(limit: number): Promise<MestreArcanoStudyTask[]>;
  getConnectedSharePointSources(): Promise<{
    connected: boolean;
    sources: MestreArcanoSharePointSource[];
  }>;
  getSharePointDocumentContext(sourceId: string): Promise<unknown>;
};
