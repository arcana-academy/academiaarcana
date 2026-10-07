import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import type { EducationalOverview } from "@/application/education/p1";
import type { ArchivedPageLearningHistory } from "@/infrastructure/supabase/education/practice-repository";
import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { FeatureCard } from "@/components/ui/feature-card";
import {
  evidenceConfidenceLabel,
  objectiveEvidenceStateLabel,
  selfAssessmentEvidenceStateLabel,
} from "@/lib/education/evidence-state-copy";
import { getReviewPracticeHref } from "./review-handoff";

export type StatisticsGamificationProjection = {
  level: number;
  levelProgressXp: number;
  totalXp: number;
  streakDays: number;
  completedMissionCount: number;
  missionCount: number;
  progressPercent: number;
};

export type StatisticsViewProps = {
  gamification: StatisticsGamificationProjection;
  educational: EducationalOverview;
  archivedLearningHistory: ArchivedPageLearningHistory[];
};

/** Formats a normalized evidence value for learner-facing statistics. */
function percent(value: number | null): string {
  return value === null ? "Sem dados" : `${Math.round(value * 100)}%`;
}

function GamificationStats({
  gamification,
}: {
  gamification: StatisticsGamificationProjection;
}) {
  return (
    <ArcanaFeatureGrid>
      <FeatureCard
        title="Nível"
        description="Progressão calculada exclusivamente a partir do XP persistido."
        icon={<BarChart3 size={20} />}
      >
        <p className="aa-state-copy">Nível {gamification.level}</p>
        <div
          className="aa-progress-track"
          role="progressbar"
          aria-label="Progresso para o próximo nível"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={gamification.progressPercent}
        >
          <div
            className="aa-progress-value"
            style={{ width: `${gamification.progressPercent}%` }}
          />
        </div>
        <p className="aa-state-copy">
          {gamification.levelProgressXp} XP no nível · {gamification.totalXp} XP total
        </p>
      </FeatureCard>

      <FeatureCard
        title="Continuidade"
        description="Sequência atual registrada pelo sistema de gamificação."
        icon={
          <Image
            src="/assets/gamification/aa-contained-arcane-flame.svg"
            alt=""
            width={22}
            height={22}
          />
        }
      >
        <p className="aa-state-copy">
          {gamification.streakDays} {gamification.streakDays === 1 ? "dia" : "dias"}
        </p>
      </FeatureCard>

      <FeatureCard
        title="Missões de hoje"
        description="Conclusões reais registradas para a data atual."
        icon={<Target size={20} />}
      >
        <p className="aa-state-copy">
          {gamification.completedMissionCount}/{gamification.missionCount} concluídas
        </p>
      </FeatureCard>

      <FeatureCard
        title="XP"
        description="Experiência concedida por eventos de estudo reconhecidos."
        icon={<Sparkles size={20} />}
      >
        <p className="aa-state-copy">{gamification.totalXp} XP</p>
      </FeatureCard>
    </ArcanaFeatureGrid>
  );
}

/** Renders learning statistics kept separate from XP, streaks and missions. */
function EducationalStats({ educational }: { educational: EducationalOverview }) {
  return (
    <section
      className="aa-card aa-card-elevated"
      aria-labelledby="education-stats-title"
    >
      <p className="aa-eyebrow">P1 · Estatísticas educacionais</p>
      <h2 id="education-stats-title">Evidência de aprendizagem</h2>
      <p className="aa-state-copy">
        Cada indicador abaixo identifica sua fonte. Ausência de tentativas permanece
        como ausência de evidência.
      </p>
      <ArcanaFeatureGrid>
        <FeatureCard
          title="Práticas"
          description="Atividades nativas criadas e vinculadas a conteúdos próprios."
          icon={<BookOpen size={20} />}
        >
          <p className="aa-state-copy">
            {educational.statistics.practiceItemCount}
          </p>
        </FeatureCard>

        <FeatureCard
          title="Recuperações"
          description="Tentativas registradas de recuperação ativa."
          icon={<TrendingUp size={20} />}
        >
          <p className="aa-state-copy">{educational.statistics.attemptCount}</p>
        </FeatureCard>

        <FeatureCard
          title="Taxa de recuperação forte"
          description="Tentativas marcadas como fortes ÷ tentativas totais."
          icon={<TrendingUp size={20} />}
        >
          <p className="aa-state-copy">
            {percent(educational.statistics.retrievalSuccessRate)}
          </p>
        </FeatureCard>

        <FeatureCard
          title="Evidência média"
          description="Média das pontuações explícitas das autoavaliações."
          icon={<BarChart3 size={20} />}
        >
          <p className="aa-state-copy">
            {percent(educational.statistics.averageEvidenceScore)}
          </p>
        </FeatureCard>

        <FeatureCard
          title="Páginas praticadas"
          description="Conteúdos próprios com pelo menos uma tentativa."
          icon={<BookOpen size={20} />}
        >
          <p className="aa-state-copy">
            {educational.statistics.practicedPageCount}
          </p>
        </FeatureCard>

        <FeatureCard
          title="Revisões liberadas"
          description="Itens cujo intervalo de revisão baseado no último resultado já chegou."
          icon={<Target size={20} />}
        >
          <p className="aa-state-copy">
            {educational.statistics.reviewDueCount}
          </p>
        </FeatureCard>

        <FeatureCard
          title="Evidência autorreportada forte"
          description="Itens com pelo menos três autoavaliações recentes e média de evidência ≥ 90%. Isso não confirma domínio acadêmico."
          icon={<Sparkles size={20} />}
        >
          <p className="aa-state-copy">
            {educational.statistics.itemsWithStrongSelfReportedEvidence}
          </p>
        </FeatureCard>

        <FeatureCard
          title="Domínios confirmados"
          description="Avaliações objetivas cujo critério declarado foi satisfeito pelo mínimo de tentativas definido."
          icon={<Target size={20} />}
        >
          <p className="aa-state-copy">
            {educational.statistics.objectiveConfirmedCount}
          </p>
        </FeatureCard>

        <FeatureCard
          title="Avaliações objetivas"
          description="Quantidade de tarefas com critério explícito de correspondência exata normalizada."
          icon={<BookOpen size={20} />}
        >
          <p className="aa-state-copy">
            {educational.statistics.objectiveAssessmentCount}
          </p>
        </FeatureCard>
      </ArcanaFeatureGrid>
    </section>
  );
}

/** Renders confidence-labelled educational profile signals. */
function ProfileSignals({ educational }: { educational: EducationalOverview }) {
  return (
    <section className="aa-card aa-card-default" aria-labelledby="profile-signals-title">
      <h2 id="profile-signals-title">Perfil educacional atual</h2>
      <p className="aa-state-copy">
        Estes são sinais revisáveis derivados do histórico disponível; não são
        rótulos permanentes.
      </p>
      <dl className="aa-list">
        <div className="aa-list-item aa-surface">
          <dt>Cobertura de prática</dt>
          <dd>
            {Math.round(educational.profile.practiceCoverage.value)}% · confiança{" "}
            {evidenceConfidenceLabel(educational.profile.practiceCoverage.confidence)}
          </dd>
        </div>
        <div className="aa-list-item aa-surface">
          <dt>Desempenho de recuperação</dt>
          <dd>
            {Math.round(educational.profile.retrievalPerformance.value)}% · confiança{" "}
            {evidenceConfidenceLabel(educational.profile.retrievalPerformance.confidence)}
          </dd>
        </div>
        <div className="aa-list-item aa-surface">
          <dt>Revisões que pedem atenção</dt>
          <dd>
            {educational.profile.reviewNeed.value} item(s) · confiança{" "}
            {evidenceConfidenceLabel(educational.profile.reviewNeed.confidence)}
          </dd>
        </div>
        <div className="aa-list-item aa-surface">
          <dt>Amostra</dt>
          <dd>{educational.profile.sampleSize} tentativa(s)</dd>
        </div>
      </dl>
    </section>
  );
}

/** Renders item-level self-reported evidence projections. */
function EvidenceSection({ educational }: { educational: EducationalOverview }) {
  return (
    <section className="aa-card aa-card-default" aria-labelledby="mastery-title">
      <h2 id="mastery-title">Evidência autorreportada por conteúdo</h2>
      {educational.evidence.length ? (
        <ul className="aa-list">
          {educational.evidence.map((entry) => (
            <li className="aa-list-item aa-surface" key={entry.practiceItemId}>
              <div>
                <strong>{entry.pageTitle}</strong>
                <p>
                  {selfAssessmentEvidenceStateLabel(entry.state)} · {percent(entry.score)} · {entry.attemptCount} tentativa(s) · fonte: autoavaliação
                </p>
                <span className="aa-state-copy">{entry.reason}</span>
              </div>
              <Link
                href={`/pratica?pagina=${encodeURIComponent(entry.pageId)}&item=${encodeURIComponent(entry.practiceItemId)}`}
              >
                Praticar
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="aa-state-copy">Sem atividades de prática ainda.</p>
      )}
    </section>
  );
}

/** Renders criterion-referenced objective evidence with scoped confirmation. */
function ObjectiveEvidenceSection({
  educational,
}: {
  educational: EducationalOverview;
}) {
  return (
    <section
      className="aa-card aa-card-default"
      aria-labelledby="objective-evidence-title"
    >
      <h2 id="objective-evidence-title">Evidência objetiva</h2>
      {educational.objectiveEvidence.length ? (
        <ul className="aa-list">
          {educational.objectiveEvidence.map((entry) => (
            <li className="aa-list-item aa-surface" key={entry.practiceItemId}>
              <div>
                <strong>{entry.pageTitle}</strong>
                <p>
                  {objectiveEvidenceStateLabel(entry.state)} · {entry.passingAttemptCount}/{entry.minimumEvidence} aprovações ·{" "}
                  {entry.attemptCount} tentativa(s) · fonte: critério explícito
                </p>
                <span className="aa-state-copy">{entry.reason}</span>
              </div>
              <Link
                href={
                  "/pratica?pagina=" +
                  encodeURIComponent(entry.pageId) +
                  "&avaliacao=" +
                  encodeURIComponent(entry.practiceItemId)
                }
              >
                Avaliar
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="aa-state-copy">
          Nenhuma avaliação objetiva foi criada ainda. A ausência aqui não significa ausência de aprendizagem.
        </p>
      )}
    </section>
  );
}

/** Renders revisable signals derived from repeated weak educational evidence. */
function GapsSection({ educational }: { educational: EducationalOverview }) {
  return (
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
  );
}

/** Shows user-owned snapshots kept when pages with learning records are removed. */
function ArchivedLearningHistorySection({
  entries,
}: {
  entries: ArchivedPageLearningHistory[];
}) {
  return (
    <section className="aa-card aa-card-default" aria-labelledby="learning-history-title">
      <p className="aa-eyebrow">Registros preservados</p>
      <h2 id="learning-history-title">Histórico de conteúdos removidos</h2>
      <p className="aa-state-copy">
        Conteúdo, progresso, atividades e tentativas continuam consultáveis aqui
        após a remoção da página. Este histórico é privado da sua conta.
      </p>
      {entries.length === 0 ? (
        <p className="aa-state-copy">
          Nenhum conteúdo com registros de aprendizagem foi removido.
        </p>
      ) : (
        <ul className="aa-list">
          {entries.map((entry) => {
            const page = entry.snapshot.page;
            const pageText = page.content?.blocks
              ?.map((block) => block.content)
              .filter(Boolean)
              .join("\\n\\n");
            const attempts = entry.snapshot.practiceItems.flatMap((item) =>
              item.attempts.map((attempt) => ({ item, attempt })),
            );

            return (
              <li key={entry.id} className="aa-list-item aa-surface">
                <details>
                  <summary>
                    <strong>{page.title}</strong>
                    <span className="aa-state-copy">
                      {" · "}Arquivado em{" "}
                      {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
                        new Date(entry.archivedAt),
                      )}
                      {" · "}{entry.snapshot.practiceItems.length} atividade(s)
                      {" · "}{attempts.length} tentativa(s)
                    </span>
                  </summary>
                  <div className="aa-stack">
                    {pageText ? (
                      <section aria-label="Conteúdo preservado">
                        <h3>Conteúdo</h3>
                        <p>{pageText}</p>
                      </section>
                    ) : null}
                    {entry.snapshot.pageProgress.map((progress, index) => (
                      <p key={index} className="aa-state-copy">
                        Progresso: {progress.status === "completed" ? "Concluído" : progress.status === "in-progress" ? "Em andamento" : "Não iniciado"}
                      </p>
                    ))}
                    {entry.snapshot.practiceItems.map((item) => (
                      <section key={item.id} aria-label={`Atividade: ${item.prompt}`}>
                        <h3>{item.prompt}</h3>
                        <p><strong>Referência:</strong> {item.reference_answer}</p>
                        {item.explanation ? <p><strong>Explicação:</strong> {item.explanation}</p> : null}
                        {item.attempts.map((attempt) => (
                          <div key={attempt.id}>
                            <p className="aa-state-copy">
                              Tentativa de{" "}
                              {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
                                new Date(attempt.created_at),
                              )}{" · "}{attempt.outcome}{" · "}evidência{" "}
                              {Math.round(Number(attempt.evidence_score) * 100)}%
                            </p>
                            <p><strong>Resposta:</strong> {attempt.answer}</p>
                            <p><strong>Feedback:</strong> {attempt.feedback}</p>
                          </div>
                        ))}
                      </section>
                    ))}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Renders the current review queue from the adaptive learning signals. */
function ReviewSection({ educational }: { educational: EducationalOverview }) {
  const due = educational.reviews.filter((review) => review.due);

  return (
    <section className="aa-card aa-card-default" aria-labelledby="review-title">
      <h2 id="review-title">Revisão</h2>
      {due.length ? (
        <ul className="aa-list">
          {due.map((review) => {
            const practiceHref = getReviewPracticeHref(review, educational);

            return (
              <li className="aa-list-item aa-surface" key={review.practiceItemId}>
                <div>
                  <strong>Revisão liberada</strong>
                  <p>{review.reason}</p>
                </div>
                {practiceHref ? (
                  <Link href={practiceHref}>Revisar</Link>
                ) : (
                  <span className="aa-state-copy">
                    Contexto da revisão indisponível.
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="aa-state-copy">Não há revisão liberada neste momento.</p>
      )}
    </section>
  );
}

/** Pure presentation for authenticated statistics projections. */
export function StatisticsView({
  gamification,
  educational,
  archivedLearningHistory,
}: StatisticsViewProps) {
  return (
    <ArcanaPage
      eyebrow="Conhecimento sobre sua jornada"
      title="Estatísticas"
      description="Indicadores educacionais derivados de tentativas reais, separados das métricas de gamificação."
    >
      <GamificationStats gamification={gamification} />
      <EducationalStats educational={educational} />
      <ArchivedLearningHistorySection entries={archivedLearningHistory} />
      <ProfileSignals educational={educational} />
      <EvidenceSection educational={educational} />
      <ObjectiveEvidenceSection educational={educational} />
      <GapsSection educational={educational} />
      <ReviewSection educational={educational} />
    </ArcanaPage>
  );
}
