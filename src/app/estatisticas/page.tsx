import Image from "next/image";
import { BarChart3, BookOpen, Sparkles, Target, TrendingUp } from "lucide-react";

import { getEducationalOverview } from "@/application/education/p1";
import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeatureCard } from "@/components/ui/feature-card";
import { getProgression } from "@/domains/gamification";
import { SupabaseGamificationRepository } from "@/infrastructure/supabase/gamification/gamification-repository";
import { SupabaseEducationalPracticeRepository } from "@/infrastructure/supabase/education/practice-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function percent(value: number | null) {
  return value === null ? "Sem dados" : `${Math.round(value * 100)}%`;
}

export default async function EstatisticasPage() {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  const repository = new SupabaseGamificationRepository(supabase);
  const educationalRepository = new SupabaseEducationalPracticeRepository(supabase);
  const [profile, missions, educational] = await Promise.all([
    repository.getProfile(claims.sub),
    repository.listDailyMissions(claims.sub, todayUtc()),
    getEducationalOverview(educationalRepository, claims.sub),
  ]);

  const progression = getProgression(profile, missions);
  const progressPercent = Math.min(
    100,
    Math.round(
      (progression.levelProgressXp /
        Math.max(
          1,
          progression.nextLevelXp -
            ((progression.level - 1) ** 2 * 100),
        )) *
        100,
    ),
  );

  return (
    <AuthenticatedShell currentPath="/estatisticas">
      <ArcanaPage
        eyebrow="Conhecimento sobre sua jornada"
        title="Estatísticas"
        description="Indicadores educacionais derivados de tentativas reais, separados das métricas de gamificação."
      >
        <ArcanaFeatureGrid>
          <FeatureCard title="Nível" description="Progressão calculada exclusivamente a partir do XP persistido." icon={<BarChart3 size={22} />}>
            <p className="aa-state-copy">Nível {progression.level}</p>
            <div className="aa-progress-track" role="progressbar" aria-label="Progresso para o próximo nível" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
              <div className="aa-progress-value" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="aa-state-copy">{progression.levelProgressXp} XP no nível · {progression.totalXp} XP total</p>
          </FeatureCard>
          <FeatureCard
            title="Continuidade"
            description="Sequência atual registrada pelo sistema de gamificação."
            icon={<Image src="/assets/gamification/aa-contained-arcane-flame.svg" alt="" width={22} height={22} />}
          >
            <p className="aa-state-copy">{progression.streakDays} {progression.streakDays === 1 ? "dia" : "dias"}</p>
          </FeatureCard>
          <FeatureCard title="Missões de hoje" description="Conclusões reais registradas para a data atual." icon={<Target size={22} />}>
            <p className="aa-state-copy">{progression.completedMissionCount}/{missions.length} concluídas</p>
          </FeatureCard>
          <FeatureCard title="XP" description="Experiência concedida por eventos de estudo reconhecidos." icon={<Sparkles size={22} />}>
            <p className="aa-state-copy">{progression.totalXp} XP</p>
          </FeatureCard>
        </ArcanaFeatureGrid>

        <section className="aa-card aa-card-elevated" aria-labelledby="education-stats-title">
          <p className="aa-eyebrow">P1 · Estatísticas educacionais</p>
          <h2 id="education-stats-title">Aprendizagem observável</h2>
          <p className="aa-state-copy">
            Cada indicador abaixo identifica sua fonte. Ausência de tentativas permanece
            como ausência de evidência.
          </p>
          <ArcanaFeatureGrid>
            <FeatureCard title="Práticas" description="Atividades nativas criadas e vinculadas a conteúdos próprios." icon={<BookOpen size={22} />}>
              <p className="aa-state-copy">{educational.statistics.practiceItemCount}</p>
            </FeatureCard>
            <FeatureCard title="Recuperações" description="Tentativas registradas de recuperação ativa." icon={<TrendingUp size={22} />}>
              <p className="aa-state-copy">{educational.statistics.attemptCount}</p>
            </FeatureCard>
            <FeatureCard title="Taxa de recuperação forte" description="Tentativas marcadas como fortes ÷ tentativas totais." icon={<TrendingUp size={22} />}>
              <p className="aa-state-copy">{percent(educational.statistics.retrievalSuccessRate)}</p>
            </FeatureCard>
            <FeatureCard title="Evidência média" description="Média das pontuações explícitas das autoavaliações." icon={<BarChart3 size={22} />}>
              <p className="aa-state-copy">{percent(educational.statistics.averageEvidenceScore)}</p>
            </FeatureCard>
            <FeatureCard title="Páginas praticadas" description="Conteúdos próprios com pelo menos uma tentativa." icon={<BookOpen size={22} />}>
              <p className="aa-state-copy">{educational.statistics.practicedPageCount}</p>
            </FeatureCard>
            <FeatureCard title="Revisões liberadas" description="Itens cujo intervalo de revisão baseado no último resultado já chegou." icon={<Target size={22} />}>
              <p className="aa-state-copy">{educational.statistics.reviewDueCount}</p>
            </FeatureCard>
            <FeatureCard title="Evidência forte de domínio" description="Itens com pelo menos três tentativas recentes e média de evidência ≥ 90%." icon={<Sparkles size={22} />}>
              <p className="aa-state-copy">{educational.statistics.masteryWithStrongEvidence}</p>
            </FeatureCard>
          </ArcanaFeatureGrid>
        </section>

        <section className="aa-card aa-card-default" aria-labelledby="profile-signals-title">
          <h2 id="profile-signals-title">Perfil educacional atual</h2>
          <p className="aa-state-copy">
            Estes são sinais revisáveis derivados do histórico disponível; não são rótulos permanentes.
          </p>
          <dl className="aa-list">
            <div className="aa-list-item aa-surface">
              <dt>Cobertura de prática</dt>
              <dd>{Math.round(educational.profile.practiceCoverage.value)}% · confiança {educational.profile.practiceCoverage.confidence}</dd>
            </div>
            <div className="aa-list-item aa-surface">
              <dt>Desempenho de recuperação</dt>
              <dd>{Math.round(educational.profile.retrievalPerformance.value)}% · confiança {educational.profile.retrievalPerformance.confidence}</dd>
            </div>
            <div className="aa-list-item aa-surface">
              <dt>Revisões que pedem atenção</dt>
              <dd>{educational.profile.reviewNeed.value} item(s) · confiança {educational.profile.reviewNeed.confidence}</dd>
            </div>
            <div className="aa-list-item aa-surface">
              <dt>Amostra</dt>
              <dd>{educational.profile.sampleSize} tentativa(s)</dd>
            </div>
          </dl>
        </section>

        <section className="aa-card aa-card-default" aria-labelledby="mastery-title">
          <h2 id="mastery-title">Evidência por conteúdo</h2>
          {educational.mastery.length ? (
            <ul className="aa-list">
              {educational.mastery.map((entry) => (
                <li className="aa-list-item aa-surface" key={entry.practiceItemId}>
                  <div>
                    <strong>{entry.pageTitle}</strong>
                    <p>{entry.state} · {percent(entry.score)} · {entry.attemptCount} tentativa(s)</p>
                    <span className="aa-state-copy">{entry.reason}</span>
                  </div>
                  <Link href={`/pratica?pagina=${encodeURIComponent(entry.pageId)}&item=${encodeURIComponent(entry.practiceItemId)}`}>
                    Praticar
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="aa-state-copy">Sem atividades de prática ainda.</p>
          )}
        </section>

        <section className="aa-card aa-card-default" aria-labelledby="gaps-title">
          <h2 id="gaps-title">Possíveis lacunas</h2>
          {educational.learningGaps.length ? (
            <ul className="aa-list">
              {educational.learningGaps.map((gap) => (
                <li className="aa-list-item aa-surface" key={gap.practiceItemId}>
                  <div>
                    <strong>{gap.pageTitle}</strong>
                    <p>{gap.evidence}</p>
                    <span className="aa-state-copy">{gap.reason}</span>
                  </div>
                  <Link href={gap.actionHref}>Investigar</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="aa-state-copy">
              Nenhuma lacuna sinalizada com a evidência disponível. Isso não significa que
              todas as competências estejam dominadas.
            </p>
          )}
        </section>

        <section className="aa-card aa-card-default" aria-labelledby="review-title">
          <h2 id="review-title">Revisão</h2>
          {educational.reviews.some((review) => review.due) ? (
            <ul className="aa-list">
              {educational.reviews.filter((review) => review.due).map((review) => (
                <li className="aa-list-item aa-surface" key={review.practiceItemId}>
                  <div>
                    <strong>Revisão liberada</strong>
                    <p>{review.reason}</p>
                  </div>
                  <Link href={`/pratica?item=${encodeURIComponent(review.practiceItemId)}`}>Revisar</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="aa-state-copy">Não há revisão liberada neste momento.</p>
          )}
        </section>
      </ArcanaPage>
    </AuthenticatedShell>
  );
}
