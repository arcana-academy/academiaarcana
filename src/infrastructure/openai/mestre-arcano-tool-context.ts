import type { SupabaseClient } from "@supabase/supabase-js";

import type { MestreArcanoToolContext } from "@/domains/intelligence";
import { SupabaseGamificationRepository } from "@/infrastructure/supabase/gamification/gamification-repository";
import { SupabaseStudyTaskRepository } from "@/infrastructure/supabase/planning/study-task-repository";
import type { MicrosoftSharePointCredentials } from "@/infrastructure/integrations/microsoft-sharepoint";
import { SupabaseMestreArcanoDocumentSourceRepository } from "@/infrastructure/supabase/intelligence/mestre-arcano-document-source-repository";

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createMestreArcanoToolContext({
  supabase,
  ownerId,
  microsoftSharePointCredentials,
}: {
  readonly supabase: SupabaseClient;
  readonly ownerId: string;
  readonly microsoftSharePointCredentials: MicrosoftSharePointCredentials | null;
}): MestreArcanoToolContext {
  const gamification = new SupabaseGamificationRepository(supabase);
  const planning = new SupabaseStudyTaskRepository(supabase);
  const documents = new SupabaseMestreArcanoDocumentSourceRepository(
    supabase,
    ownerId,
    microsoftSharePointCredentials,
  );

  return {
    learner: {
      async getGamificationProfile() {
        const profile = await gamification.getProfile(ownerId);
        return {
          xp: profile?.xp ?? 0,
          streakDays: profile?.streakDays ?? 0,
          lastActiveOn: profile?.lastActiveOn ?? null,
          updatedAt: profile?.updatedAt ?? null,
        };
      },

      async listTodayMissions(targetDate = utcToday()) {
        const missions = await gamification.listDailyMissions(ownerId, targetDate);
        return missions.map((mission) => ({
          id: mission.id,
          code: mission.code,
          title: mission.title,
          rewardXp: mission.rewardXp,
          targetDate: mission.targetDate,
          completed: mission.status === "completed",
          completedAt: mission.completedAt,
        }));
      },

      async listUpcomingStudyTasks(now: string, limit = 5) {
        const tasks = await planning.listUpcoming(ownerId, now, limit);
        return tasks.map((task) => ({
          id: task.id,
          title: task.title,
          dueAt: task.dueAt,
          status: task.status,
          completedAt: task.completedAt,
        }));
      },
    },
    documents,
  };
}
