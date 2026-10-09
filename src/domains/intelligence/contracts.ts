/** Public contracts owned by the intelligence domain. */

/**
 * Minimal read-models exposed to the Mestre Arcano.
 *
 * These are boundary DTOs, not domain entities. They intentionally contain
 * only the fields needed by the authorized tools.
 */
export type MestreArcanoGamificationSnapshot = {
  readonly xp: number;
  readonly streakDays: number;
  readonly lastActiveOn: string | null;
  readonly updatedAt: string | null;
};

export type MestreArcanoMissionSnapshot = {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly rewardXp: number;
  readonly targetDate: string;
  readonly completed: boolean;
  readonly completedAt: string | null;
};

export type MestreArcanoStudyTaskSnapshot = {
  readonly id: string;
  readonly title: string;
  readonly dueAt: string | null;
  readonly status: "pending" | "completed" | "cancelled";
  readonly completedAt: string | null;
};

export type MestreArcanoConnectedSharePointSource = {
  readonly sourceId: string;
  readonly name: string | null;
  readonly mimeType: string | null;
  readonly webUrl: string | null;
  readonly lastModifiedAt: string | null;
  readonly sizeBytes: number | null;
  readonly status: "active";
};

export type MestreArcanoDocumentContext = {
  readonly source: {
    readonly id: string;
    readonly providerId: "microsoft-sharepoint";
    readonly siteId: string;
    readonly driveId: string;
    readonly itemId: string;
    readonly name: string | null;
    readonly mimeType: string | null;
    readonly webUrl: string | null;
    readonly lastModifiedAt: string | null;
    readonly sizeBytes: number | null;
  };
  readonly content: string;
  readonly truncated: boolean;
  readonly currentDocument: {
    readonly name: string | null;
    readonly mimeType: string | null;
    readonly sizeBytes: number | null;
    readonly lastModifiedAt: string | null;
    readonly webUrl: string | null;
  };
};

/**
 * Consumer-defined ports for the minimal authorized context needed by
 * intelligence tools. Implementations must bind these ports to the current
 * authenticated subject before they are passed to the AI runtime.
 */
export type MestreArcanoLearnerContextPort = {
  getGamificationProfile(): Promise<MestreArcanoGamificationSnapshot>;
  listTodayMissions(targetDate: string): Promise<MestreArcanoMissionSnapshot[]>;
  listUpcomingStudyTasks(
    now: string,
    limit: number,
  ): Promise<MestreArcanoStudyTaskSnapshot[]>;
};

export type MestreArcanoDocumentContextPort = {
  listConnectedSharePointSources(): Promise<{
    readonly connected: boolean;
    readonly sources: readonly MestreArcanoConnectedSharePointSource[];
  }>;
  getSharePointDocumentContext(
    sourceId: string,
  ): Promise<MestreArcanoDocumentContext>;
};

export type MestreArcanoToolContext = {
  readonly learner: MestreArcanoLearnerContextPort;
  readonly documents: MestreArcanoDocumentContextPort;
};

export const MESTRE_ARCANO_HELP_LEVELS = [
  "unspecified",
  "hint",
  "decomposition",
  "direct-answer",
] as const;

export type MestreArcanoHelpLevel =
  (typeof MESTRE_ARCANO_HELP_LEVELS)[number];

export function resolveMestreArcanoHelpLevel(
  value: unknown,
): MestreArcanoHelpLevel | null {
  if (value === undefined) return "unspecified";
  return typeof value === "string" &&
    MESTRE_ARCANO_HELP_LEVELS.includes(value as MestreArcanoHelpLevel)
    ? (value as MestreArcanoHelpLevel)
    : null;
}

export type MestreArcanoExecution = {
  readonly output: string;
  readonly responseId: string | null;
  readonly model: string;
  readonly instructionPolicyVersion: string;
};

export type MestreArcanoGateway = {
  execute(input: string): Promise<MestreArcanoExecution>;
};
