import Link from "next/link";

import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { SupabaseEducationalPracticeRepository } from "@/infrastructure/supabase/education/practice-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

import {
  buildLearnerReviewQueue,
  type ReviewQueueEntry,
  type LearnerReviewQueue,
} from "@/application/education/review-queue";

function formatReviewDate(isoDate: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(isoDate));
}

function ReviewList({
  entries,
  label,
}: {
  entries: ReviewQueueEntry[];
  label: string;
}) {
  return (
    <ol className="aa-list" aria-label={label}>
      {entries.map((entry) => (
        <li key={entry.practiceItemId} className="aa-list-item aa-surface">
          <div>
            <p className="aa-eyebrow">{entry.pageTitle}</p>
            <strong>{entry.prompt}</strong>
            <p className="aa-state-copy">
              {entry.due
                ? "Revisão disponível"
                : `Próxima revisão prevista: ${formatReviewDate(entry.nextReviewAt)} UTC`}
            </p>
            <p className="aa-state-copy">{entry.reason}</p>
          </div>
          <Link className="aa-button aa-button-secondary aa-button-sm" href={entry.href}>
            Abrir prática
          </Link>
        </li>
      ))}
    </ol>
  );
}

export default async function RevisoesPage() {
  const claims = await requireAuthenticatedUser();
  let queue: LearnerReviewQueue | null = null;

  try {
    const supabase = await createClient();
    const repository = new SupabaseEducationalPracticeRepository(supabase);
    const [pages, items, attempts] = await Promise.all([
      repository.listPages(claims.sub),
      repository.listPracticeItems(claims.sub),
      repository.listPracticeAttempts(claims.sub),
    ]);
    queue = buildLearnerReviewQueue(claims.sub, pages, items, attempts);
  } catch {
    // Do not turn a read outage into an invented empty educational history.
  }

  return (
    <AuthenticatedShell currentPath="/pratica">
      <main className="aa-page aa-page-narrow" aria-labelledby="revisoes-title">
        <header className="aa-page-header">
          <div className="aa-page-header-copy">
            <p className="aa-eyebrow">Aprendizagem · recuperação espaçada</p>
            <h1 id="revisoes-title">Minhas revisões</h1>
            <p>
              Retome atividades conforme suas tentativas registradas, sem
              exigências de sequência perfeita ou recompensas artificiais.
            </p>
          </div>
        </header>

        {queue === null ? (
          <section className="aa-surface aa-sanctuary-section" role="alert">
            <h2>Não foi possível consultar suas revisões</h2>
            <p>O histórico não foi apagado. A consulta está indisponível neste momento.</p>
            <form action="/revisoes" method="get">
              <button className="aa-button aa-button-secondary" type="submit">
                Tentar novamente
              </button>
            </form>
          </section>
        ) : (
          <>
            <section className="aa-surface aa-sanctuary-section" aria-labelledby="revisoes-due-title">
              <h2 id="revisoes-due-title">Revisões disponíveis ({queue.due.length})</h2>
              {queue.due.length ? (
                <ReviewList entries={queue.due} label="Atividades disponíveis para revisão" />
              ) : (
                <p className="aa-state-copy">Nenhuma revisão disponível neste momento.</p>
              )}
            </section>
            <section className="aa-surface aa-sanctuary-section" aria-labelledby="revisoes-upcoming-title">
              <h2 id="revisoes-upcoming-title">Próximas revisões ({queue.upcoming.length})</h2>
              {queue.upcoming.length ? (
                <ReviewList entries={queue.upcoming} label="Próximas revisões previstas" />
              ) : (
                <p className="aa-state-copy">
                  Ainda não há outras revisões previstas. Uma primeira tentativa
                  registrada pode gerar uma sugestão de retorno.
                </p>
              )}
            </section>
          </>
        )}

        <nav aria-label="Continuar estudando" className="aa-action-row">
          <Link className="aa-button aa-button-primary" href="/sessao-revisao">
            Iniciar revisão guiada
          </Link>
          <Link className="aa-button aa-button-primary" href="/pratica">
            Ir para Prática
          </Link>
          <Link className="aa-button aa-button-secondary" href="/workspace">
            Abrir Workspace
          </Link>
        </nav>
      </main>
    </AuthenticatedShell>
  );
}
