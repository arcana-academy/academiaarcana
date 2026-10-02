import Link from "next/link";

import { buildEducationalOverview } from "@/application/education/p1";
import {
  createPracticeItemAction,
  submitPracticeAttemptAction,
  planPracticeReviewAction,
} from "./actions";
import { SupabaseEducationalPracticeRepository } from "@/infrastructure/supabase/education/practice-repository";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

type PracticePageProps = {
  searchParams: Promise<{
    pagina?: string;
    item?: string;
  }>;
};

function formatPercent(value: number | null): string {
  if (value === null) return "Sem dados";
  return `${Math.round(value * 100)}%`;
}

function formatDate(value: string | null): string {
  return value
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(new Date(value))
    : "Ainda não programada";
}

export default async function PraticaPage({
  searchParams,
}: PracticePageProps) {
  const claims = await requireAuthenticatedUser();
  const params = await searchParams;
  const supabase = await createClient();
  const repository = new SupabaseEducationalPracticeRepository(supabase);

  const [pages, items, attempts] = await Promise.all([
    repository.listPages(claims.sub),
    repository.listPracticeItems(claims.sub),
    repository.listPracticeAttempts(claims.sub),
  ]);
  const overview = buildEducationalOverview(pages, items, attempts);

  const selectedPage =
    pages.find((page) => page.id === params.pagina) ?? pages[0] ?? null;
  const pageItems = selectedPage
    ? items.filter((item) => item.pageId === selectedPage.id)
    : [];
  const selectedItem =
    pageItems.find((item) => item.id === params.item) ?? pageItems[0] ?? null;
  const selectedAttempts = selectedItem
    ? attempts
        .filter((attempt) => attempt.practiceItemId === selectedItem.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : [];
  const latestAttempt = selectedAttempts[0] ?? null;
  const review = selectedItem
    ? overview.reviews.find((entry) => entry.practiceItemId === selectedItem.id)
    : null;
  const gap = selectedItem
    ? overview.learningGaps.find(
        (entry) => entry.practiceItemId === selectedItem.id,
      )
    : null;
  const mastery = selectedItem
    ? overview.mastery.find(
        (entry) => entry.practiceItemId === selectedItem.id,
      )
    : null;

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
          <section className="aa-card aa-card-default" aria-labelledby="pages-title">
            <h2 id="pages-title">Conteúdos praticáveis</h2>
            <div role="list" className="aa-list">
              {pages.map((page) => (
                <Link
                  key={page.id}
                  role="listitem"
                  className="aa-list-item aa-surface"
                  href={`/pratica?pagina=${encodeURIComponent(page.id)}`}
                  aria-current={selectedPage?.id === page.id ? "page" : undefined}
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

          {selectedPage ? (
            <section className="aa-card aa-card-elevated" aria-labelledby="selected-page-title">
              <p className="aa-eyebrow">Conteúdo selecionado</p>
              <h2 id="selected-page-title">{selectedPage.title}</h2>

              {pageItems.length ? (
                <div className="aa-list" role="list" aria-label="Atividades deste conteúdo">
                  {pageItems.map((item) => {
                    const itemReview = overview.reviews.find(
                      (entry) => entry.practiceItemId === item.id,
                    );
                    return (
                      <Link
                        key={item.id}
                        className="aa-list-item aa-surface"
                        role="listitem"
                        href={`/pratica?pagina=${encodeURIComponent(item.pageId)}&item=${encodeURIComponent(item.id)}`}
                        aria-current={selectedItem?.id === item.id ? "page" : undefined}
                      >
                        <span>
                          <strong>{item.prompt}</strong>
                          <span className="aa-state-copy">
                            Dificuldade {item.difficulty}/5 ·{" "}
                            {itemReview?.due ? "revisão liberada" : "sem revisão pendente"}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="aa-state-copy">
                  Este conteúdo ainda não tem uma atividade de recuperação.
                </p>
              )}

              <form action={createPracticeItemAction} className="aa-form">
                <input type="hidden" name="pageId" value={selectedPage.id} />
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
                <label htmlFor="practice-reference">
                  Resposta de referência
                </label>
                <textarea
                  id="practice-reference"
                  name="referenceAnswer"
                  rows={5}
                  required
                  minLength={1}
                  maxLength={5000}
                  placeholder="Inclua os pontos essenciais para comparação depois da tentativa."
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
            </section>
          ) : null}

          {selectedItem ? (
            <section className="aa-card aa-card-elevated" aria-labelledby="practice-session-title">
              <p className="aa-eyebrow">Recuperação ativa</p>
              <h2 id="practice-session-title">{selectedItem.prompt}</h2>
              <p className="aa-state-copy">
                Responda primeiro. A referência só aparece depois de existir uma
                tentativa registrada.
              </p>

              <form action={submitPracticeAttemptAction} className="aa-form">
                <input
                  type="hidden"
                  name="practiceItemId"
                  value={selectedItem.id}
                />
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
                        <p>{selectedItem.referenceAnswer}</p>
                      </div>
                      {selectedItem.explanation ? (
                        <div>
                          <h4>Explicação / próximo passo</h4>
                          <p>{selectedItem.explanation}</p>
                        </div>
                      ) : null}
                    </div>
                  </details>
                </div>
              ) : null}

              {mastery ? (
                <div className="aa-card aa-card-default" aria-labelledby="mastery-state-title">
                  <h3 id="mastery-state-title">Evidência atual</h3>
                  <p>
                    Estado: <strong>{mastery.state}</strong>
                    {mastery.score === null ? "" : ` · ${formatPercent(mastery.score)}`}
                    {" · "}
                    {mastery.attemptCount} tentativa(s).
                  </p>
                  <p className="aa-state-copy">{mastery.reason}</p>
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
                      <input
                        type="hidden"
                        name="practiceItemId"
                        value={selectedItem.id}
                      />
                      <input
                        type="hidden"
                        name="title"
                        value={`Revisar: ${selectedItem.prompt}`}
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
          ) : null}
        </>
      )}
      </main>
    </AuthenticatedShell>
  );
}
