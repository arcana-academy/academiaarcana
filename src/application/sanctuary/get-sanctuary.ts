import {
  decideSanctuaryPriority,
  resolveContinueLearning,
  resolveGamificationAvailability,
  resolvePlanningAvailability,
  resolveProgressAvailability,
} from "@/domains/sanctuary";

import type { SanctuaryGrimoire, SanctuaryUser, SanctuaryViewModel } from "@/domains/sanctuary";
import type { PageProgress } from "@/domains/learning";
import type { StudyTask } from "@/domains/planning";
import type { Mission } from "@/domains/gamification";

export type SanctuarySessionContext = { user: SanctuaryUser };

export type SanctuaryRepository = {
  getLearningHierarchy: () => Promise<SanctuaryGrimoire[]>;
  getPageProgress?: (ownerId: string, pageIds: string[]) => Promise<PageProgress[]>;
  listUpcomingStudyTasks?: (ownerId: string, now: string, limit?: number) => Promise<StudyTask[]>;
  listDailyMissions?: (ownerId: string, targetDate: string) => Promise<Mission[]>;
};

const WORKSPACE_TREE_HREF = "/workspace?view=tree";
const WORKSPACE_HREF = WORKSPACE_TREE_HREF + "#current";

function buildContinueLearningHref(context: NonNullable<ReturnType<typeof resolveContinueLearning>>): string {
  if (context.pageId) return WORKSPACE_TREE_HREF + "&page=" + encodeURIComponent(context.pageId) + "#current";
  if (context.chapterId) return WORKSPACE_TREE_HREF + "&chapter=" + encodeURIComponent(context.chapterId) + "#current";
  if (context.notebookId) return WORKSPACE_TREE_HREF + "&notebook=" + encodeURIComponent(context.notebookId) + "#current";
  return WORKSPACE_TREE_HREF + "&grimoire=" + encodeURIComponent(context.grimoireId) + "#current";
}

function createQuickActions() {
  return [{ id: "open-workspace", label: "Abrir Workspace", href: WORKSPACE_HREF, priority: "supporting" as const }];
}

function collectPageIds(grimoires: SanctuaryGrimoire[]): string[] {
  return grimoires.flatMap((grimoire) => grimoiresPageIds(grimoire));
}

function grimoiresPageIds(grimoire: SanctuaryGrimoire): string[] {
  return grimoire.notebooks.flatMap((notebook) =>
    notebook.chapters.flatMap((chapter) => chapter.pages.map((page) => page.id)),
  );
}

function resolveProgressSummary(grimoires: SanctuaryGrimoire[], progress: PageProgress[]): SanctuaryViewModel["progress"] {
  const totalPages = collectPageIds(grimoires).length;
  if (totalPages === 0) return { status: "empty", data: null };
  const completedPages = progress.filter((item) => item.status === "completed").length;
  return {
    status: "ready",
    data: {
      percentage: Math.round((completedPages / totalPages) * 100),
      label: completedPages + " de " + totalPages + " páginas concluídas",
    },
  };
}

function mapSchedule(tasks: StudyTask[]): SanctuaryViewModel["schedule"] {
  if (tasks.length === 0) return { status: "empty", data: null };
  return {
    status: "ready",
    data: tasks.map((task) => ({
      id: task.id,
      time: task.dueAt
        ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(task.dueAt))
        : "Sem prazo",
      title: task.title,
    })),
  };
}

function mapMissions(missions: Mission[]): SanctuaryViewModel["missions"] {
  if (missions.length === 0) return { status: "empty", data: null };
  return {
    status: "ready",
    data: missions.map((mission) => ({
      id: mission.id,
      title: mission.title,
      reward: "+" + mission.rewardXp + " XP",
      isCompleted: mission.status === "completed",
    })),
  };
}

export async function getSanctuary(repository: SanctuaryRepository, sessionContext: SanctuarySessionContext): Promise<SanctuaryViewModel> {
  let grimoires: SanctuaryGrimoire[] = [];
  try { grimoires = await repository.getLearningHierarchy(); } catch { grimoires = []; }

  const continueContext = resolveContinueLearning(grimoires);
  const continueLearning = continueContext ? { ...continueContext, href: buildContinueLearningHref(continueContext) } : null;
  const priorities = decideSanctuaryPriority({ continueLearning });
  const primaryPriority = priorities.find((decision) => decision.priority === "primary") ?? null;
  const quickActions = createQuickActions();
  const primaryAction = primaryPriority?.section === "continueLearning" && continueLearning !== null
    ? { id: "continue-learning", label: "Continuar aprendendo", href: continueLearning.href, priority: "primary" as const }
    : quickActions[0];

  let progress: SanctuaryViewModel["progress"] = { status: "not-configured", data: null };
  if (resolveProgressAvailability() !== "not-configured" && repository.getPageProgress) {
    try {
      progress = resolveProgressSummary(grimoires, await repository.getPageProgress(sessionContext.user.id, collectPageIds(grimoires)));
    } catch {
      progress = { status: "error", data: null, message: "Não foi possível carregar o progresso." };
    }
  }

  let missions: SanctuaryViewModel["missions"] = { status: "not-configured", data: null };
  if (resolveGamificationAvailability() !== "not-configured" && repository.listDailyMissions) {
    try {
      missions = mapMissions(await repository.listDailyMissions(sessionContext.user.id, new Date().toISOString().slice(0, 10)));
    } catch {
      missions = { status: "error", data: null, message: "Não foi possível carregar as missões." };
    }
  }

  let schedule: SanctuaryViewModel["schedule"] = { status: "not-configured", data: null };
  if (resolvePlanningAvailability() !== "not-configured" && repository.listUpcomingStudyTasks) {
    try {
      schedule = mapSchedule(await repository.listUpcomingStudyTasks(sessionContext.user.id, new Date().toISOString()));
    } catch {
      schedule = { status: "error", data: null, message: "Não foi possível carregar a agenda." };
    }
  }

  return {
    header: { greeting: "Seu Santuário de aprendizagem", user: sessionContext.user },
    primaryAction, continueLearning, progress, missions, schedule, quickActions,
  };
}