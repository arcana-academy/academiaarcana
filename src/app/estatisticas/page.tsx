import { BarChart3, BookOpen, Flame, Sparkles, Target, TrendingUp } from "lucide-react";
import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeatureCard } from "@/components/ui/feature-card";
import { getProgression } from "@/domains/gamification";
import { SupabaseGamificationRepository } from "@/infrastructure/supabase/gamification/gamification-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

export default async function EstatisticasPage() {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  const repository = new SupabaseGamificationRepository(supabase);
  const profile = await repository.getProfile(claims.sub);
  const missions = await repository.listDailyMissions(claims.sub, todayUtc());
  const progression = getProgression(profile, missions);
  const progressPercent = Math.min(
    100,
    Math.round((progression.levelProgressXp / Math.max(1, progression.nextLevelXp - ((progression.level - 1) ** 2 * 100))) * 100),
  );

  return (
    <AuthenticatedShell currentPath="/estatisticas">
      <ArcanaPage
        eyebrow="Conhecimento sobre sua jornada"
        title="Estatísticas"
        description="Indicadores derivados do estado persistido da sua aprendizagem e gamificação."
      >
        <ArcanaFeatureGrid>
          <FeatureCard title="Nível" description="Progressão calculada exclusivamente a partir do XP persistido." icon={<BarChart3 size={22} />}>
            <p className="aa-state-copy">Nível {progression.level}</p>
            <div className="aa-progress-track" role="progressbar" aria-label="Progresso para o próximo nível" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
              <div className="aa-progress-value" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="aa-state-copy">{progression.levelProgressXp} XP no nível · {progression.totalXp} XP total</p>
          </FeatureCard>
          <FeatureCard title="Continuidade" description="Sequência atual registrada pelo sistema de gamificação." icon={<Flame size={22} />}>
            <p className="aa-state-copy">{progression.streakDays} {progression.streakDays === 1 ? "dia" : "dias"}</p>
          </FeatureCard>
          <FeatureCard title="Missões de hoje" description="Conclusões reais registradas para a data atual." icon={<Target size={22} />}>
            <p className="aa-state-copy">{progression.completedMissionCount}/{missions.length} concluídas</p>
          </FeatureCard>
          <FeatureCard title="XP" description="Experiência concedida por eventos de estudo reconhecidos." icon={<Sparkles size={22} />}>
            <p className="aa-state-copy">{progression.totalXp} XP</p>
          </FeatureCard>
          <FeatureCard title="Aprendizagem" description="A estatística deve continuar sendo uma projeção das fontes reais, não uma segunda base de dados." icon={<BookOpen size={22} />}>
            <p className="aa-state-copy">{profile ? "Dados de gamificação disponíveis." : "Ainda não há atividade reconhecida para este perfil."}</p>
          </FeatureCard>
          <FeatureCard title="Tendência" description="Não inferimos tendências sem histórico suficiente." icon={<TrendingUp size={22} />}>
            <p className="aa-state-copy">Quando houver histórico suficiente, esta área poderá apresentar tendências verificáveis.</p>
          </FeatureCard>
        </ArcanaFeatureGrid>
      </ArcanaPage>
    </AuthenticatedShell>
  );
}
