import { getEducationalOverview } from "@/application/education/p1";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { getProgression } from "@/domains/gamification";
import { SupabaseEducationalPracticeRepository } from "@/infrastructure/supabase/education/practice-repository";
import { SupabaseGamificationRepository } from "@/infrastructure/supabase/gamification/gamification-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import { StatisticsView } from "./StatisticsView";

/** Returns the current UTC calendar day used by persisted gamification missions. */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Loads authenticated statistics projections and delegates rendering to the pure view. */
export default async function EstatisticasPage() {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  const repository = new SupabaseGamificationRepository(supabase);
  const educationalRepository = new SupabaseEducationalPracticeRepository(supabase);

  const [profile, missions, educational, archivedLearningHistory] = await Promise.all([
    repository.getProfile(claims.sub),
    repository.listDailyMissions(claims.sub, todayUtc()),
    getEducationalOverview(educationalRepository, claims.sub),
    educationalRepository.listArchivedPageHistory(claims.sub),
  ]);

  const progression = getProgression(profile, missions);
  const denominator = Math.max(
    1,
    progression.nextLevelXp - (progression.level - 1) ** 2 * 100,
  );
  const progressPercent = Math.min(
    100,
    Math.round((progression.levelProgressXp / denominator) * 100),
  );

  return (
    <AuthenticatedShell currentPath="/estatisticas">
      <StatisticsView
        gamification={{
          level: progression.level,
          levelProgressXp: progression.levelProgressXp,
          totalXp: progression.totalXp,
          streakDays: progression.streakDays,
          completedMissionCount: progression.completedMissionCount,
          missionCount: missions.length,
          progressPercent,
        }}
        educational={educational}
        archivedLearningHistory={archivedLearningHistory}
      />
    </AuthenticatedShell>
  );
}
