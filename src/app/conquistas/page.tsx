import { Award, CheckCircle2, Crown, Gem } from "lucide-react";
import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeatureCard } from "@/components/ui/feature-card";
import { getAchievements, getProgression } from "@/domains/gamification";
import { SupabaseGamificationRepository } from "@/infrastructure/supabase/gamification/gamification-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

export default async function ConquistasPage() {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  const repository = new SupabaseGamificationRepository(supabase);
  const profile = await repository.getProfile(claims.sub);
  const missions = await repository.listDailyMissions(claims.sub, todayUtc());
  const progression = getProgression(profile, missions);
  const achievements = getAchievements(profile, missions);
  const unlocked = achievements.filter((achievement) => achievement.unlocked);

  return (
    <AuthenticatedShell currentPath="/conquistas">
      <ArcanaPage
        eyebrow="Reconhecimento"
        title="Conquistas"
        description="Marcos derivados de progresso verificável, sem inventar conquistas para preencher a interface."
      >
        <ArcanaFeatureGrid>
          <FeatureCard title="Desbloqueadas" description="Conquistas que seu estado persistido já comprova." icon={<Award size={22} />}>
            <p className="aa-state-copy">{unlocked.length}/{achievements.length}</p>
            {unlocked.length ? (
              <ul className="aa-list" aria-label="Conquistas desbloqueadas">
                {unlocked.map((achievement) => (
                  <li className="aa-list-item" key={achievement.code}>
                    <div>
                      <strong>{achievement.title}</strong>
                      <p>{achievement.description}</p>
                    </div>
                    <CheckCircle2 size={20} aria-label="Desbloqueada" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="aa-state-copy">Seu próximo marco será calculado a partir do progresso real.</p>
            )}
          </FeatureCard>
          <FeatureCard title="Próximos marcos" description="Regras transparentes para você saber o que cada conquista exige." icon={<Crown size={22} />}>
            <ul className="aa-list" aria-label="Próximas conquistas">
              {achievements.filter((achievement) => !achievement.unlocked).map((achievement) => (
                <li className="aa-list-item" key={achievement.code}>
                  <div>
                    <strong>{achievement.title}</strong>
                    <p>{achievement.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </FeatureCard>
          <FeatureCard title="Seu estado" description="O catálogo é uma projeção do estado de gamificação, não uma fonte paralela." icon={<Gem size={22} />}>
            <p className="aa-state-copy">Nível {progression.level} · {progression.totalXp} XP · {progression.streakDays} dias de sequência.</p>
          </FeatureCard>
        </ArcanaFeatureGrid>
      </ArcanaPage>
    </AuthenticatedShell>
  );
}
