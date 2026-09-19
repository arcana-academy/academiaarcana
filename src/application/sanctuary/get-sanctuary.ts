import {
  decideSanctuaryPriority,
  resolveContinueLearning,
} from "@/domains/sanctuary";

import type {
  SanctuaryGrimoire,
  SanctuaryUser,
  SanctuaryViewModel,
} from "@/domains/sanctuary";

export type SanctuarySessionContext = {
  user: SanctuaryUser;
};

export type SanctuaryRepository = {
  getLearningHierarchy: () => Promise<SanctuaryGrimoire[]>;
};

const WORKSPACE_HREF = "/workspace?view=tree#current";

function buildContinueLearningHref(
  context: NonNullable<ReturnType<typeof resolveContinueLearning>>,
): string {
  if (context.pageId) {
    return `${WORKSPACE_HREF}&page=${encodeURIComponent(context.pageId)}`;
  }

  if (context.chapterId) {
    return `${WORKSPACE_HREF}&chapter=${encodeURIComponent(
      context.chapterId,
    )}`;
  }

  if (context.notebookId) {
    return `${WORKSPACE_HREF}&notebook=${encodeURIComponent(
      context.notebookId,
    )}`;
  }

  return `${WORKSPACE_HREF}&grimoire=${encodeURIComponent(
    context.grimoireId,
  )}`;
}

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

export async function getSanctuary(
  repository: SanctuaryRepository,
  sessionContext: SanctuarySessionContext,
): Promise<SanctuaryViewModel> {
  let grimoires: SanctuaryGrimoire[] = [];

  try {
    grimoires = await repository.getLearningHierarchy();
  } catch {
    grimoires = [];
  }

  const continueContext = resolveContinueLearning(grimoires);

  const continueLearning = continueContext
    ? {
        ...continueContext,
        href: buildContinueLearningHref(continueContext),
      }
    : null;

  const priorities = decideSanctuaryPriority({
    continueLearning,
  });

  const primaryPriority =
    priorities.find((decision) => decision.priority === "primary") ?? null;

  const quickActions = createQuickActions();

  const primaryAction =
    primaryPriority?.section === "continueLearning" &&
    continueLearning !== null
      ? {
          id: "continue-learning",
          label: "Continuar aprendendo",
          href: continueLearning.href,
          priority: "primary" as const,
        }
      : quickActions[0];

  return {
    header: {
      greeting: "Seu Santuário de aprendizagem",
      user: sessionContext.user,
    },
    primaryAction,
    continueLearning,
    progress: null,
    missions: [],
    schedule: [],
    quickActions,
  };
}