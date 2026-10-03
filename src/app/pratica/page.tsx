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
import type { ObjectiveAssessment, PracticeAttempt, PracticeItem } from "@/domains/education";
import type { ObjectiveEvidenceProjection } from "@/domains/learning";
import {
  createPracticeItemAction,
  planPracticeReviewAction,
  submitPracticeAttemptAction,
  createObjectiveAssessmentAction,
  submitObjectiveAssessmentAction,
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

function PracticeSession({
  item,
  attempts,
  overview,
}: {
  item: PracticeItem;
  attempts: PracticeAttempt[];
  overview: EducationalOverview;
}) {
  const latestAttempt = attempts[0] ?? null;
  const review =
    overview.reviews.find(
      (entry: ReviewRecommendation) => entry.practiceItemId === item.id,
    ) ?? null;
  const evidence =
    overview.evidence.find(
      (entry: EvidenceProjection) => entry.practiceItemId === item.id,
    ) ?? null;
  const gap =
    overview.learningGaps.find(
      (entry: LearningGapSignal) => entry.practiceItemId === item.id,
    ) ?? null;

  return (
    <section
      className="aa-card aa-card-elevated"
      aria-labelledby="practice-session-title"
    >
      <p className="aa-eyebrow">Recuperação ativa</p>
      <h2 id="practice-session-title">{item.prompt}</h2>
      <p className="aa-state-copy">
        Responda primeiro. A referência só aparece depois de existir uma tentativa
        registrada.
      </p>

      <form action={submitPracticeAttemptAction} className="aa-form">
        <input type="hidden" name="practiceItemId" value={item.id} />
        <label htmlFor="practice-answer">Sua resposta</label>
        <textarea
          id="practice-answer"
          name="answer"
          rows={8}
          required
          minLength={1}
          maxLength={5000}
          placeholder="Escreva o que você consegue recuperar sem consultar."
        />
        <fieldset>
          <legend>Como você avalia esta recuperação?</legend>
          <label>
            <input type="radio" name="outcome" value="strong" required />
            Forte — consegui recuperar os pontos essenciais.
          </label>
          <label>
            <input type="radio" name="outcome" value="partial" />
            Parcial — lembrei parte, mas algo importante faltou.
          </label>
          <label>
            <input type="radio" name="outcome" value="insufficient" />
            Insuficiente — preciso consultar e tentar novamente.
          </label>
        </fieldset>
        <button className="aa-button aa-button-primary" type="submit">
          Registrar recuperação
        </button>
      </form>

      {latestAttempt ? (
        <div className="aa-card aa-card-default" aria-live="polite">
          <h3>Feedback da tentativa</h3>
          <p className="aa-state-copy">{latestAttempt.feedback}</p>
          <p>
            Resultado: <strong>{latestAttempt.outcome}</strong> · evidência{" "}
            <strong>{formatPercent(latestAttempt.evidenceScore)}</strong>.
          </p>
          <details>
            <summary>Ver sua resposta e a referência</summary>
            <div className="aa-stack">
              <div>
                <h4>Sua resposta</h4>
                <p>{latestAttempt.answer}</p>
              </div>
              <div>
                <h4>Referência</h4>
                <p>{item.referenceAnswer}</p>
              </div>
              {item.explanation ? (
                <div>
                  <h4>Explicação / próximo passo</h4>
                  <p>{item.explanation}</p>
                </div>
              ) : null}
            </div>
          </details>
        </div>
      ) : null}

      {evidence ? (
        <div className="aa-card aa-card-default" aria-labelledby="evidence-state-title">
          <h3 id="evidence-state-title">Evidência autorreportada atual</h3>
          <p>
            Estado: <strong>{evidence.state}</strong>
            {evidence.score === null ? "" : ` · ${formatPercent(evidence.score)}`}
            {" · "}
            {evidence.attemptCount} tentativa(s).
          </p>
          <p className="aa-state-copy">{evidence.reason}</p>
        </div>
      ) : null}

      {review ? (
        <div className="aa-card aa-card-default">
          <h3>Revisão</h3>
          <p className="aa-state-copy">{review.reason}</p>
          <p>
            {review.due
              ? "A revisão deste item está liberada."
              : `Próxima revisão: ${formatDate(review.nextReviewAt)}.`}
          </p>
          {review.nextReviewAt ? (
            <form action={planPracticeReviewAction} className="aa-form">
              <input type="hidden" name="practiceItemId" value={item.id} />
              <input type="hidden" name="title" value={`Revisar: ${item.prompt}`} />
              <input
                type="hidden"
                name="dueAt"
                value={review.due ? new Date().toISOString() : review.nextReviewAt}
              />
              <button className="aa-button aa-button-secondary" type="submit">
                Adicionar ao Cronograma
              </button>
            </form>
          ) : (
            <p className="aa-state-copy">
              A revisão será programável depois que existir uma tentativa registrada.
            </p>
          )}
        </div>
      ) : null}

      {gap ? (
        <aside className="aa-card aa-card-default" aria-labelledby="gap-title">
          <h3 id="gap-title">Possível lacuna de aprendizagem</h3>
          <p>{gap.evidence}</p>
          <p className="aa-state-copy">{gap.reason}</p>
          <Link className="aa-button aa-button-secondary" href={gap.actionHref}>
            Investigar com nova prática
          </Link>
        </aside>
      ) : null}
    </section>
  );
}

function ObjectiveAssessmentCreationForm({ pageId }: { pageId: string }) {
  return (
    <form action={createObjectiveAssessmentAction} className="aa-form">
      <h3>Adicionar avaliação objetiva</h3>
      <p className="aa-state-copy">
        V1 usa somente correspondência exata normalizada. Isso produz evidência
        objetiva sobre esta tarefa, não uma avaliação semântica geral.
      </p>
      <input type="hidden" name="pageId" value={pageId} />
      <label htmlFor="objective-prompt">Pergunta ou desafio objetivo</label>
      <textarea id="objective-prompt" name="prompt" rows={3} required maxLength={1000} />
      <label htmlFor="objective-reference">Resposta de referência</label>
      <textarea id="objective-reference" name="referenceAnswer" rows={4} required maxLength={5000} />
      <label htmlFor="objective-minimum">Tentativas aprovadas necessárias</label>
      <input id="objective-minimum" name="minimumEvidence" type="number" min={1} max={10} defaultValue={2} required />
      <button className="aa-button aa-button-secondary" type="submit">
        Criar avaliação objetiva
      </button>
    </form>
  );
}

function ObjectiveAssessmentSection({
  assessments,
  evidence,
  selectedPageId,
}: {
  assessments: ObjectiveAssessment[];
  evidence: ObjectiveEvidenceProjection[];
  selectedPageId: string;
}) {
  const pageAssessments = assessments.filter((entry) => entry.pageId === selectedPageId);
  if (!pageAssessments.length) {
    return (
      <section className="aa-card aa-card-default" aria-labelledby="objective-title">
        <h3 id="objective-title">Evidência objetiva</h3>
        <p className="aa-state-copy">
          Ainda não há uma avaliação criterion-referenced para este conteúdo.
        </p>
        <ObjectiveAssessmentCreationForm pageId={selectedPageId} />
      </section>
    );
  }

  return (
    <section className="aa-card aa-card-default" aria-labelledby="objective-title">
      <h3 id="objective-title">Evidência objetiva</h3>
      <p className="aa-state-copy">
        O resultado é calculado pelo critério declarado e permanece limitado ao escopo da tarefa.
      </p>
      {pageAssessments.map((assessment) => {
        const projection = evidence.find((entry) => entry.assessmentId === assessment.id);
        return (
          <div className="aa-card aa-card-default" key={assessment.id}>
            <h4>{assessment.prompt}</h4>
            <p>{assessment.criterion}</p>
            <p>
              Estado: <strong>{projection?.state ?? "unknown"}</strong> ·{" "}
              {projection?.attemptCount ?? 0} tentativa(s) · mínimo {assessment.minimumEvidence}
            </p>
            <p className="aa-state-copy">{projection?.reason ?? "Ainda não há evidência objetiva."}</p>
            {projection?.masteryConfirmed ? (
              <p><strong>Domínio confirmado neste escopo de avaliação.</strong></p>
            ) : null}
            <form action={submitObjectiveAssessmentAction} className="aa-form">
              <input type="hidden" name="assessmentId" value={assessment.id} />
              <label htmlFor={`objective-answer-${assessment.id}`}>Sua resposta</label>
              <textarea id={`objective-answer-${assessment.id}`} name="answer" rows={5} required maxLength={5000} />
              <button className="aa-button aa-button-primary" type="submit">Registrar evidência objetiva</button>
            </form>
          </div>
        );
      })}
    </section>
  );
}

/** Renders the authenticated native-retrieval practice experience. */
export default async function PraticaPage({
  searchParams,
}: PracticePageProps) {
  const claims = await requireAuthenticatedUser();
  const params = await searchParams;
  const supabase = await createClient();
  const repository = new SupabaseEducationalPracticeRepository(supabase);

  const [pages, items, attempts, objectiveAssessments, objectiveAttempts] =
    await Promise.all([
      repository.listPages(claims.sub),
      repository.listPracticeItems(claims.sub),
      repository.listPracticeAttempts(claims.sub),
      repository.listObjectiveAssessments(claims.sub),
      repository.listObjectiveAttempts(claims.sub),
    ]);
  const overview = buildEducationalOverview(
    pages,
    items,
    attempts,
    new Date(),
    objectiveAssessments,
    objectiveAttempts,
  );

  const selectedPage =
    pages.find((page) => page.id === params.pagina) ?? pages[0] ?? null;
  const pageItems = selectedPage
    ? practiceItemsForPage(items, selectedPage.id)
    : [];
  const selectedItem =
    pageItems.find((item) => item.id === params.item) ?? pageItems[0] ?? null;

  return (
    <AuthenticatedShell currentPath="/pratica">
      <main className="aa-page" aria-labelledby="practice-title">
        <header className="aa-card aa-card-elevated">
          <p className="aa-eyebrow">Núcleo educacional P1</p>
          <h1 id="practice-title">Prática e recuperação</h1>
          <p className="aa-state-copy">
            Produza uma resposta antes de consultar a referência. O resultado abaixo
            usa sua autoavaliação como evidência explícita; ele não é um diagnóstico
            nem uma avaliação semântica automática.
          </p>
          <nav aria-label="Navegação educacional" className="aa-action-row">
            <Link className="aa-button aa-button-secondary" href="/workspace">
              Voltar ao Workspace
            </Link>
            <Link className="aa-button aa-button-secondary" href="/estatisticas">
              Ver estatísticas educacionais
            </Link>
          </nav>
        </header>

        {pages.length === 0 ? (
          <section className="aa-card aa-card-default" aria-labelledby="empty-pages-title">
            <h2 id="empty-pages-title">Crie um conteúdo para começar</h2>
            <p className="aa-state-copy">
              A prática é vinculada a uma página própria. Crie uma página no Workspace
              e volte aqui para registrar uma atividade de recuperação.
            </p>
            <Link className="aa-button aa-button-primary" href="/workspace">
              Abrir Workspace
            </Link>
          </section>
        ) : (
          <>
            <PageSelector
              pages={pages}
              items={items}
              selectedPageId={selectedPage?.id}
            />

            {selectedPage ? (
              <section
                className="aa-card aa-card-elevated"
                aria-labelledby="selected-page-title"
              >
                <p className="aa-eyebrow">Conteúdo selecionado</p>
                <h2 id="selected-page-title">{selectedPage.title}</h2>
                <PracticeItemList
                  items={pageItems}
                  selectedItemId={selectedItem?.id}
                  overview={overview}
                />
                <PracticeCreationForm pageId={selectedPage.id} />
                <ObjectiveAssessmentSection
                  assessments={overview.objectiveAssessments}
                  evidence={overview.objectiveEvidence}
                  selectedPageId={selectedPage.id}
                />
              </section>
            ) : null}

            {selectedItem ? (
              <PracticeSession
                item={selectedItem}
                attempts={attemptsForItem(attempts, selectedItem.id)}
                overview={overview}
              />
            ) : null}

            {selectedPage ? (
              <ObjectiveEvidenceSection
                pageId={selectedPage.id}
                assessments={objectiveAssessments}
                attempts={objectiveAttempts}
                selectedAssessmentId={params.avaliacao}
                evidence={overview.objectiveEvidence}
              />
            ) : null}
          </>
        )}
      </main>
    </AuthenticatedShell>
  );
}
