import { decideSanctuaryPriority } from "@/domains/sanctuary";

import type {
  SanctuarySnapshot,
  SanctuaryViewModel,
} from "@/domains/sanctuary";

const WORKSPACE_HREF = "/workspace?view=tree#current";

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

export function buildSanctuaryViewModel(
  snapshot: SanctuarySnapshot,
): SanctuaryViewModel {
  const priorities = decideSanctuaryPriority({
    continueLearning: snapshot.continueLearning,
  });

  const primaryDecision = priorities.find(
    (decision) => decision.priority === "primary",
  );

  const quickActions = createQuickActions();

  const primaryAction =
    primaryDecision?.section === "continueLearning" &&
    snapshot.continueLearning !== null
      ? {
          id: "continue-learning",
          label: "Continuar aprendendo",
          href: snapshot.continueLearning.href,
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
  };
}