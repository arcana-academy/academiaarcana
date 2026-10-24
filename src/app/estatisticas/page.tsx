import { getEducationalOverview } from "@/application/education/p1";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { getProgression } from "@/domains/gamification";
import { SupabaseEducationalPracticeRepository } from "@/infrastructure/supabase/education/practice-repository";
import { SupabaseGamificationRepository } from "@/infrastructure/supabase/gamification/gamification-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import { StatisticsView } from "./StatisticsView";
import { pageMetadata } from "@/lib/seo/site-metadata";

export const metadata = pageMetadata("/estatisticas");

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

  let snapshot: Awaited<ReturnType<typeof loadStatistics>> | null = null;

  async function loadStatistics() {
    return Promise.all([
    repository.getProfile(claims.sub),
    repository.listDailyMissions(claims.sub, todayUtc()),
    getEducationalOverview(educationalRepository, claims.sub),
    ]);
  }

  try {
    snapshot = await loadStatistics();
  } catch {
    // A failed read is not evidence of zero progress or absent learning.
  }

  if (snapshot === null) {
    return (
      <AuthenticatedShell currentPath="/estatisticas">
        <ArcanaPage eyebrow="Progresso" title="Estatísticas" description="Indicadores baseados em dados verificáveis.">
          <section className="aa-surface aa-sanctuary-section" role="alert" aria-labelledby="statistics-unavailable-title">
            <h2 id="statistics-unavailable-title">Não foi possível carregar suas estatísticas</h2>
            <p>Os indicadores estão temporariamente indisponíveis. Tente novamente para consultar seu progresso.</p>
            <form action="/estatisticas" method="get">
              <button className="aa-button aa-button-secondary" type="submit">Tentar novamente</button>
            </form>
          </section>
        </ArcanaPage>
      </AuthenticatedShell>
    );
  }

  const [profile, missions, educational] = snapshot;
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
      />
    </AuthenticatedShell>
  );
}
