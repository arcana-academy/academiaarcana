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
import type { PracticeAttempt, PracticeItem } from "@/domains/education";
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
  evidence: EvidenceProjection | import("@/domains/learning").ObjectiveEvidenceProjection;
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
      <div className="aa-card aa-card-default" aria-live="polite">
        <h3>Estado da evidência</h3>
        <p><strong>{evidence.state}</strong> · {evidence.attemptCount} tentativa(s) · {evidence.passingAttemptCount} aprovada(s).</p>
        <p className="aa-state-copy">{evidence.reason}</p>
        {evidence.masteryConfirmed ? (
          <p>Os critérios declarados desta avaliação foram satisfeitos. Esta conclusão vale apenas para o escopo declarado.</p>
        ) : null}
        {latest ? <p className="aa-state-copy">Última tentativa: {latest.feedback}</p> : null}
      </div>
    </section>
  );
}
\nfunction PracticeSession({
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
  const objectiveAssessment = overview.objectiveEvidence.find((entry) => entry.assessmentId === params.avaliacao) ?? null;
  const objectiveAssessments = overview.objectiveEvidence;

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
              </section>
            ) : null}

            {objectiveAssessments.length ? (
              <section className="aa-card aa-card-default" aria-labelledby="objective-list-title">
                <h2 id="objective-list-title">Avaliações objetivas</h2>
                <ul className="aa-list">
                  {objectiveAssessments.map((entry) => (
                    <li className="aa-list-item aa-surface" key={entry.assessmentId}>
                      <div><strong>{entry.pageTitle}</strong><p>{entry.state} · {entry.passingAttemptCount}/{entry.minimumEvidence} aprovada(s)</p><span className="aa-state-copy">{entry.reason}</span></div>
                      <Link href={`/pratica?pagina=${encodeURIComponent(entry.pageId)}&avaliacao=${encodeURIComponent(entry.assessmentId)}`}>Abrir</Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {objectiveAssessment ? (
              <ObjectiveAssessmentSession
                assessment={{
                  id: objectiveAssessment.assessmentId,
                  ownerId: claims.sub,
                  pageId: objectiveAssessment.pageId,
                  pageTitle: objectiveAssessment.pageTitle,
                  prompt: objectiveAssessment.criterion,
                  referenceAnswer: "",
                  criterion: objectiveAssessment.criterion,
                  scoringPolicy: objectiveAssessment.scoringPolicy,
                  minimumEvidence: objectiveAssessment.minimumEvidence,
                  validityScope: objectiveAssessment.validityScope,
                  criterionVersion: objectiveAssessment.criterionVersion,
                  active: true,
                  createdAt: "", updatedAt: "",
                }}
                attempts={[]}
                evidence={objectiveAssessment}
              />
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
