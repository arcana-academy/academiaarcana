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
import type {
  EvidenceProjection,
  ObjectiveEvidenceProjection,
} from "@/domains/learning";
import type {
  PracticeAttempt,
  PracticeEvidenceMode,
  PracticeItem,
} from "@/domains/education";
import {
  createPracticeItemAction,
  planPracticeReviewAction,
  submitPracticeAttemptAction,
} from "./actions";
import { SupabaseEducationalPracticeRepository } from "@/infrastructure/supabase/education/practice-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

type PracticePageProps = {
  searchParams: Promise<{
    pagina?: string;
    item?: string;
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

function practiceItemsForPage(
  items: PracticeItem[],
  pageId: string,
): PracticeItem[] {
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

/** Returns the learner-facing label for a practice evidence mode. */
function evidenceModeLabel(mode: PracticeEvidenceMode): string {
  return mode === "criterion_exact_match"
    ? "Avaliação objetiva por correspondência exata"
    : "Autoavaliação da recuperação";
}

/** Returns the learner-facing label for an objective evidence state. */
function objectiveStateLabel(
  state: ObjectiveEvidenceProjection["state"],
): string {
  return {
    unknown: "Sem evidência",
    insufficient: "Evidência insuficiente",
    developing: "Em desenvolvimento",
    confirmed: "Domínio confirmado nesta atividade",
    conflicting: "Evidências em conflito",
  }[state];
}

/** Selects a learner-owned page and shows its practice activity count. */
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

/** Renders the form for creating self-assessment or objective practice. */
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
        placeholder="Ex.: Qual é o principal conceito desta página?"
      />
      <label htmlFor="practice-reference">Resposta de referência</label>
      <textarea
        id="practice-reference"
        name="referenceAnswer"
        rows={5}
        required
        minLength={1}
        maxLength={5000}
        placeholder="Inclua a resposta esperada para comparação depois da tentativa."
      />
      <label htmlFor="practice-explanation">
        Explicação e próximo passo (opcional)
      </label>
      <textarea
        id="practice-explanation"
        name="explanation"
        rows={4}
        maxLength={2000}
        placeholder="Por que esta resposta importa? O que revisar depois?"
      />
      <label htmlFor="practice-evidence-mode">Modo de avaliação</label>
      <select
        id="practice-evidence-mode"
        name="evidenceMode"
        defaultValue="self_assessment"
      >
        <option value="self_assessment">
          Autoavaliação da recuperação
        </option>
        <option value="criterion_exact_match">
          Avaliação objetiva — correspondência exata
        </option>
      </select>
      <p className="aa-state-copy">
        Use a avaliação objetiva apenas quando uma resposta correta puder ser
        verificada por correspondência exata normalizada. Ela não é adequada para
        explicações abertas ou respostas equivalentes com redação diferente.
      </p>
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

/** Renders practice activities for the selected learner-owned page. */
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
                {evidenceModeLabel(item.evidenceMode)} · Dificuldade{" "}
                {item.difficulty}/5 ·{" "}
                {review?.due ? "revisão liberada" : "sem revisão pendente"}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/** Renders the bounded objective-evidence summary for one activity. */
function ObjectiveEvidenceSection({
  evidence,
}: {
  evidence: ObjectiveEvidenceProjection;
}) {
  return (
    <div className="aa-card aa-card-default" aria-labelledby="objective-title">
      <h3 id="objective-title">Evidência objetiva desta atividade</h3>
      <p>
        Estado: <strong>{objectiveStateLabel(evidence.state)}</strong> ·{" "}
        {evidence.passingAttemptCount}/{evidence.minimumEvidence} tentativa(s)
        aprovadas no conjunto recente.
      </p>
      <p className="aa-state-copy">{evidence.reason}</p>
      {evidence.criterion ? (
        <p>
          Critério: <strong>{evidence.criterion}</strong>
        </p>
      ) : null}
      {evidence.criterionVersion ? (
        <p className="aa-state-copy">
          Versão do critério: {evidence.criterionVersion}
        </p>
      ) : null}
      <p className="aa-state-copy">
        Escopo: somente esta atividade. O resultado não é uma classificação global
        do estudante.
      </p>
    </div>
  );
}

/** Renders the submitted response and the persisted reference snapshot. */
function PracticeAttemptDetails({
  attempt,
  item,
}: {
  attempt: PracticeAttempt;
  item: PracticeItem;
}) {
  return (
    <details>
      <summary>Ver sua resposta e a referência</summary>
      <div className="aa-stack">
        <div>
          <h4>Sua resposta</h4>
          <p>{attempt.answer}</p>
        </div>
        <div>
          <h4>Referência</h4>
          <p>{attempt.criterionReference ?? item.referenceAnswer}</p>
        </div>
        {item.explanation ? (
          <div>
            <h4>Explicação / próximo passo</h4>
            <p>{item.explanation}</p>
          </div>
        ) : null}
      </div>
    </details>
  );
}

/** Renders the submitted response and the persisted reference snapshot. */

/** Renders the latest attempt feedback and its evidence provenance. */
function PracticeAttemptFeedback({
  attempt,
  item,
}: {
  attempt: PracticeAttempt;
  item: PracticeItem;
}) {
  const evidenceLabel =
    attempt.evidenceType === "criterion-referenced"
      ? "criterion-referenced"
      : "autoavaliação";

  return (
    <div className="aa-card aa-card-default" aria-live="polite">
      <h3>Feedback da tentativa</h3>
      <p className="aa-state-copy">{attempt.feedback}</p>
      <p>
        Tipo de evidência: <strong>{evidenceLabel}</strong> · resultado{" "}
        <strong>{attempt.outcome}</strong> · evidência{" "}
        <strong>{formatPercent(attempt.evidenceScore)}</strong>.
      </p>
      {attempt.criterionResult ? (
        <p>
          Resultado do critério: <strong>{attempt.criterionResult}</strong>.
        </p>
      ) : null}
      <PracticeAttemptDetails attempt={attempt} item={item} />
    </div>
  );
}

/** Renders the answer form for self-assessment or objective evaluation. */
function PracticeAnswerForm({ item }: { item: PracticeItem }) {
  const objective = item.evidenceMode === "criterion_exact_match";

  return (
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
      {objective ? (
        <p className="aa-state-copy">
          A avaliação será calculada automaticamente pelo critério objetivo
          registrado para esta atividade.
        </p>
      ) : (
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
      )}
      <button className="aa-button aa-button-primary" type="submit">
        {objective ? "Avaliar resposta" : "Registrar recuperação"}
      </button>
    </form>
  );
}

/** Renders the current evidence panel using the correct provenance source. */
function PracticeEvidencePanel({
  item,
  selfEvidence,
  objectiveEvidence,
}: {
  item: PracticeItem;
  selfEvidence: EvidenceProjection | null;
  objectiveEvidence: ObjectiveEvidenceProjection | null;
}) {
  if (item.evidenceMode === "criterion_exact_match" && objectiveEvidence) {
    return <ObjectiveEvidenceSection evidence={objectiveEvidence} />;
  }

  if (!selfEvidence) return null;

  return (
    <div
      className="aa-card aa-card-default"
      aria-labelledby="evidence-state-title"
    >
      <h3 id="evidence-state-title">Evidência autorreportada atual</h3>
      <p>
        Estado: <strong>{selfEvidence.state}</strong>
        {selfEvidence.score === null
          ? ""
          : ` · ${formatPercent(selfEvidence.score)}`}
        {" · "}
        {selfEvidence.attemptCount} tentativa(s).
      </p>
      <p className="aa-state-copy">{selfEvidence.reason}</p>
    </div>
  );
}

/** Renders the review recommendation and optional scheduling action. */
function PracticeReviewPanel({
  item,
  review,
}: {
  item: PracticeItem;
  review: ReviewRecommendation | null;
}) {
  if (!review) return null;

  return (
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
          <input
            type="hidden"
            name="title"
            value={`Revisar: ${item.prompt}`}
          />
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
  );
}

/** Renders the learning-gap signal without treating it as a diagnosis. */
function PracticeGapPanel({ gap }: { gap: LearningGapSignal | null }) {
  if (!gap) return null;

  return (
    <aside className="aa-card aa-card-default" aria-labelledby="gap-title">
      <h3 id="gap-title">Possível lacuna de aprendizagem</h3>
      <p>{gap.evidence}</p>
      <p className="aa-state-copy">{gap.reason}</p>
      <Link className="aa-button aa-button-secondary" href={gap.actionHref}>
        Investigar com nova prática
      </Link>
    </aside>
  );
}

/** Renders the objective criterion notice when the activity declares one. */
function PracticeCriterionNotice({ item }: { item: PracticeItem }) {
  if (item.evidenceMode !== "criterion_exact_match" || !item.criterion) {
    return null;
  }

  return (
    <p className="aa-state-copy">
      <strong>Critério:</strong> {item.criterion}
    </p>
  );
}

/** Renders feedback only when an attempt is available. */
function PracticeFeedbackSlot({
  attempt,
  item,
}: {
  attempt: PracticeAttempt | undefined;
  item: PracticeItem;
}) {
  return attempt ? <PracticeAttemptFeedback attempt={attempt} item={item} /> : null;
}

/** Renders the objective criterion notice when the activity declares one. */

/** Renders feedback only when an attempt is available. */

/** Selects persisted signals for a practice session outside the render function. */
function practiceSessionSignals(item: PracticeItem, attempts: PracticeAttempt[], overview: EducationalOverview) {
  return {
    latestAttempt: attempts[0],
    review: overview.reviews.find((entry) => entry.practiceItemId === item.id) ?? null,
    selfEvidence: overview.evidence.find((entry) => entry.practiceItemId === item.id) ?? null,
    objectiveEvidence: overview.objectiveEvidence.find((entry) => entry.practiceItemId === item.id) ?? null,
    gap: overview.learningGaps.find((entry) => entry.practiceItemId === item.id) ?? null,
  };
}

/** Renders one practice session while keeping evidence and gamification separate. */
function PracticeSession({
  item,
  attempts,
  overview,
}: {
  item: PracticeItem;
  attempts: PracticeAttempt[];
  overview: EducationalOverview;
}) {
  const { latestAttempt, review, selfEvidence, objectiveEvidence, gap } = practiceSessionSignals(item, attempts, overview);

  return (
    <section
      className="aa-card aa-card-elevated"
      aria-labelledby="practice-session-title"
    >
      <p className="aa-eyebrow">Recuperação ativa</p>
      <h2 id="practice-session-title">{item.prompt}</h2>
      <p className="aa-state-copy">
        {evidenceModeLabel(item.evidenceMode)}. Responda primeiro; a referência só
        aparece depois de existir uma tentativa registrada.
      </p>
      <PracticeCriterionNotice item={item} />
      <PracticeAnswerForm item={item} />
      <PracticeFeedbackSlot attempt={latestAttempt} item={item} />
      <PracticeEvidencePanel
        item={item}
        selfEvidence={selfEvidence ?? null}
        objectiveEvidence={objectiveEvidence ?? null}
      />
      <PracticeReviewPanel item={item} review={review ?? null} />
      <PracticeGapPanel gap={gap ?? null} />
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

  const [pages, items, attempts] = await Promise.all([
    repository.listPages(),
    repository.listPracticeItems(claims.sub),
    repository.listPracticeAttempts(claims.sub),
  ]);
  const overview = buildEducationalOverview(pages, items, attempts);

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
            Produza uma resposta antes de consultar a referência. A Academia
            distingue autoavaliação de evidência objetiva e só confirma domínio
            dentro do escopo de um critério objetivo satisfeito.
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
          <section
            className="aa-card aa-card-default"
            aria-labelledby="empty-pages-title"
          >
            <h2 id="empty-pages-title">Crie um conteúdo para começar</h2>
            <p className="aa-state-copy">
              A prática é vinculada a uma página própria. Crie uma página no
              Workspace e volte aqui para registrar uma atividade.
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

            {selectedItem ? (
              <PracticeSession
                item={selectedItem}
                attempts={attemptsForItem(attempts, selectedItem.id)}
                overview={overview}
              />
            ) : null}
          </>
        )}
      </main>
    </AuthenticatedShell>
  );
}
