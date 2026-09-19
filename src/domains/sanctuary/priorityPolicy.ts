import type {
  ContinueLearningContext,
  PriorityDecision,
  SanctuarySection,
} from "./contracts";

export type { PriorityDecision, SanctuarySection };

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
  context?: PriorityPolicyContext | null
): PriorityDecision[] {
  const hasValidLearning = Boolean(context?.continueLearning);

  return SECTION_ORDER.map((section): PriorityDecision => {
    switch (section) {
      case "continueLearning":
        return hasValidLearning
          ? {
              section,
              priority: "primary",
              reason: "valid-learning-context",
            }
          : {
              section,
              priority: "supporting",
              reason: "no-learning-context",
            };

      case "progress":
        return {
          section,
          priority: "supporting",
          reason: "progress-supporting",
        };

      case "missions":
        return {
          section,
          priority: "supporting",
          reason: "gamification-not-configured",
        };

      case "schedule":
        return {
          section,
          priority: "supporting",
          reason: "planning-not-configured",
        };

      case "quickActions":
        return {
          section,
          priority: "supporting",
          reason: "quick-actions-supporting",
        };
    }
  });
}