import { decideSanctuaryPriority } from "@/domains/sanctuary";

import type {
  SanctuarySnapshot,
  SanctuaryViewModel,
} from "@/domains/sanctuary";

const WORKSPACE_HREF = "/workspace?view=tree#current";

/** Build the stable quick-action list exposed by the Sanctuary view model. */
function createQuickActions() {
  return [
    {
      id: "open-workspace",
      label: "Abrir Workspace",
      href: WORKSPACE_HREF,
      priority: "supporting" as const,
    },
  ];
}

/**
 * Build the presentation-ready Sanctuary view model from a domain snapshot.
 *
 * Priority is consumed from the domain policy; this layer does not invent
 * learning, progress, mission, or planning data.
 */
export function buildSanctuaryViewModel(
  snapshot: SanctuarySnapshot,
): SanctuaryViewModel {
  const continuation = snapshot.continueLearning.status === "ready"
    ? snapshot.continueLearning.data
    : null;

  const priorities = decideSanctuaryPriority({
    continueLearning: continuation,
  });

  const primaryDecision = priorities.find(
    (decision) => decision.priority === "primary",
  );

  const quickActions = createQuickActions();

  const primaryAction =
    primaryDecision?.section === "continueLearning" && continuation !== null
      ? {
          id: "continue-learning",
          label: continuation.intent === "resume" ? "Continuar aprendendo" : "Explorar conteúdo",
          href: continuation.href,
          priority: "primary" as const,
        }
      : quickActions[0];

  return {
    header: {
      greeting: "Seu Santuário de aprendizagem",
      user: snapshot.user,
    },
    primaryAction,
    continueLearning: snapshot.continueLearning,
    progress: snapshot.progress,
    missions: snapshot.missions,
    schedule: snapshot.schedule,
    quickActions,
    adaptiveRecommendation: snapshot.adaptiveRecommendation,
  };
}
