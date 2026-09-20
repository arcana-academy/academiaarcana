import type {
  ContinueLearningContext,
  PriorityDecision,
  SanctuarySection,
} from "./contracts";

export const SECTION_ORDER: readonly SanctuarySection[] = [
  "continueLearning",
  "progress",
  "missions",
  "schedule",
  "quickActions",
] as const;

export type PriorityPolicyContext = {
  continueLearning?: ContinueLearningContext | null;
};

/**
 * Task 5 — Deterministic PriorityPolicy
 *
 * Pure and deterministic priority engine for Sanctuary sections.
 *
 * Current repository state:
 * - A valid Continue Learning context is primary.
 * - Without a valid Continue Learning context, it is supporting.
 * - Planning and Gamification are currently not configured,
 *   so schedule and missions remain supporting.
 * - Progress and quick actions remain supporting.
 * - Sections are always returned in SECTION_ORDER.
 */
export function decideSanctuaryPriority(
  context?: PriorityPolicyContext | null,
): PriorityDecision[] {
  const hasValidLearning = Boolean(context?.continueLearning);

  const decisions: Record<SanctuarySection, PriorityDecision> = {
    continueLearning: hasValidLearning
      ? {
          section: "continueLearning",
          priority: "primary",
          reason: "valid-learning-context",
        }
      : {
          section: "continueLearning",
          priority: "supporting",
          reason: "no-learning-context",
        },
    progress: {
      section: "progress",
      priority: "supporting",
      reason: "progress-supporting",
    },
    missions: {
      section: "missions",
      priority: "supporting",
      reason: "gamification-not-configured",
    },
    schedule: {
      section: "schedule",
      priority: "supporting",
      reason: "planning-not-configured",
    },
    quickActions: {
      section: "quickActions",
      priority: "supporting",
      reason: "quick-actions-supporting",
    },
  };

  return SECTION_ORDER.map((section) => decisions[section]);
}
