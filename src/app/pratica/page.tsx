import Link from "next/link";

import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import {
  buildEducationalOverview,
  type EducationalOverview,
} from "@/application/education/p1";
import type {
  LearningGapSignal,
  ReviewRecommendation,
} from "@/domains/adaptive";
import type { EvidenceProjection } from "@/domains/learning";
import type { ObjectiveAttempt, ObjectiveAssessment, PracticeAttempt, PracticeItem } from "@/domains/education";
import {
  createPracticeItemAction,
  createObjectiveAssessmentAction,
  planPracticeReviewAction,
  submitObjectiveAssessmentAction,
  submitPracticeAttemptAction,
} from "./actions";
import { ObjectiveEvidenceSection } from "./objective-evidence";
import { SupabaseEducationalPracticeRepository } from "@/infrastructure/supabase/education/practice-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

type PracticePageProps = {
  searchParams: Promise<{
    pagina?: string;
    item?: string;
    avaliacao?: string;
  }>;
};

function formatPercent(value: number | null): string {
  return value === null ? "Sem dados" : `${Math.round(value * 100)}%`;
}

function formatDate(value: string | null): string {
  return value
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(new Date(value))
    : "Ainda não programada";
}

function practiceItemsForPage(items: PracticeItem[], pageId: string): PracticeItem[] {
  return items.filter((item) => item.pageId === pageId);
}

function attemptsForItem(
  attempts: PracticeAttempt[],
  itemId: string,
): PracticeAttempt[] {
  return attempts
    .filter((attempt) => attempt.practiceItemId === itemId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function PageSelector({
  pages,
  items,
  selectedPageId,
}: {
  pages: Array<{ id: string; title: string }>;
  items: PracticeItem[];
  selectedPageId?: string;
}) {
  return (
    <section className="aa-card aa-card-default" aria-labelledby="pages-title">
      <h2 id="pages-title">Conteúdos praticáveis</h2>
      <div role="list" className="aa-list">
        {pages.map((page) => (
          <Link
            key={page.id}
            role="listitem"
            className="aa-list-item aa-surface"
            href={`/pratica?pagina=${encodeURIComponent(page.id)}`}
            aria-current={selectedPageId === page.id ? "page" : undefined}
          >
            <span>
              <strong>{page.title}</strong>
              <span className="aa-state-copy">
                {items.filter((item) => item.pageId === page.id).length} atividade(s)
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PracticeCreationForm({ pageId }: { pageId: string }) {
  return (
    <form action={createPracticeItemAction} className="aa-form">
      <input type="hidden" name="pageId" value={pageId} />
      <h3>Adicionar atividade de prática</h3>
      <label htmlFor="practice-prompt">Pergunta ou desafio</label>
      <textarea
        id="practice-prompt"
        name="prompt"
        rows={3}
        required
        minLength={1}
        maxLength={1000}
        placeholder="Ex.: Explique com suas palavras a ideia central desta página."
      />
      <label htmlFor="practice-reference">Resposta de referência</label>
      <textarea
        id="practice-reference"
        name="referenceAnswer"
        rows={5}
        required
        minLength={1}
        maxLength={5000}
        placeholder="Inclua os pontos essenciais para comparação depois da tentativa."
      />
      <label htmlFor="practice-explanation">Explicação e próximo passo (opcional)</label>
      <textarea
        id="practice-explanation"
        name="explanation"
        rows={4}
        maxLength={2000}
        placeholder="Por que esta resposta importa? O que revisar depois?"
      />
      <label htmlFor="practice-difficulty">Dificuldade</label>
      <select id="practice-difficulty" name="difficulty" defaultValue="3">
        {[1, 2, 3, 4, 5].map((value) => (
          <option key={value} value={value}>
            {value}/5
          </option>
        ))}
      </select>
      <button className="aa-button aa-button-primary" type="submit">
        Criar atividade
      </button>
    </form>
  );
}

function PracticeItemList({
  items,
  selectedItemId,
  overview,
}: {
  items: PracticeItem[];
  selectedItemId?: string;
  overview: EducationalOverview;
}) {
  if (!items.length) {
    return (
      <p className="aa-state-copy">
        Este conteúdo ainda não tem uma atividade de recuperação.
      </p>
    );
  }

  return (
    <div className="aa-list" role="list" aria-label="Atividades deste conteúdo">
      {items.map((item) => {
        const review = overview.reviews.find(
          (entry: ReviewRecommendation) => entry.practiceItemId === item.id,
        );
        return (
          <Link
            key={item.id}
            className="aa-list-item aa-surface"
            role="listitem"
            href={`/pratica?pagina=${encodeURIComponent(item.pageId)}&item=${encodeURIComponent(item.id)}`}
            aria-current={selectedItemId === item.id ? "page" : undefined}
          >
            <span>
              <strong>{item.prompt}</strong>
              <span className="aa-state-copy">
                Dificuldade {item.difficulty}/5 ·{" "}
                {review?.due ? "revisão liberada" : "sem revisão pendente"}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}


function ObjectiveAssessmentSession({
  assessment,
  attempts,
  evidence,
}: {
  assessment: import("@/domains/education").ObjectiveAssessment;
  attempts: import("@/domains/education").ObjectiveAttempt[];
  evidence: import("@/domains/learning").ObjectiveEvidenceProjection;
}) {
  const latest = attempts[attempts.length - 1] ?? null;
  return (
    <section className="aa-card aa-card-elevated" aria-labelledby="objective-title">
      <p className="aa-eyebrow">Evidência objetiva V1</p>
      <h2 id="objective-title">{assessment.prompt}</h2>
      <p className="aa-state-copy">{assessment.criterion}</p>
      <p className="aa-state-copy">
        Critério: correspondência exata normalizada · mínimo: {assessment.minimumEvidence} tentativa(s).
      </p>
      <form action={submitObjectiveAssessmentAction} className="aa-form">
        <input type="hidden" name="assessmentId" value={assessment.id} />
        <label htmlFor="objective-answer">Sua resposta</label>
        <textarea id="objective-answer" name="answer" rows={6} required minLength={1} maxLength={5000} />
        <button className="aa-button aa-button-primary" type="submit">Avaliar segundo o critério</button>
      </form>
      {latest ? (
        <div className="aa-card aa-card-default" aria-live="polite">
          <h3>Feedback da última tentativa</h3>
          <p>{latest.feedback}</p>
        </div>
      ) : null}
      <div className="aa-card aa-card-default" aria-live="polite">
        <h3>Estado da evidência</h3>
        <p><strong>{evidence.state}</strong> · {evidence.attemptCount} tentativa(s) · {evidence.passingAttemptCount} aprovada(s).</p>
        <p className="aa-state-copy">{evidence.reason}</p>
        {evidence.masteryConfirmed ? (
          <p>Os critérios declarados desta avaliação foram satisfeitos. Esta conclusão vale apenas para o escopo declarado.</p>
        ) : null}
      </div>
    </section>
  );
}
            {objectiveAssessments.length ? (
              <section className="aa-card aa-card-default" aria-labelledby="objective-list-title">
                <h2 id="objective-list-title">Avaliações objetivas</h2>
                <ul className="aa-list">
                  {objectiveAssessments.map((assessment) => {
                    const evidence = overview.objectiveEvidence.find((entry) => entry.assessmentId === assessment.id);
                    return (
                      <li className="aa-list-item aa-surface" key={assessment.id}>
                        <div>
                          <strong>{assessment.prompt}</strong>
                          <p>{evidence?.state ?? "unknown"} · {evidence?.passingAttemptCount ?? 0}/{assessment.minimumEvidence} aprovada(s)</p>
                          <span className="aa-state-copy">{evidence?.reason ?? "Ainda não há evidência objetiva."}</span>
                        </div>
                        <Link href={`/pratica?pagina=${encodeURIComponent(assessment.pageId)}&avaliacao=${encodeURIComponent(assessment.id)}`}>Abrir</Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            {objectiveAssessment ? (
              <ObjectiveAssessmentSession
                assessment={objectiveAssessment}
                attempts={overview.objectiveAttempts.filter((attempt) => attempt.assessmentId === objectiveAssessment.id)}
                evidence={overview.objectiveEvidence.find((entry) => entry.assessmentId === objectiveAssessment.id)!}
              />
            ) : null}
