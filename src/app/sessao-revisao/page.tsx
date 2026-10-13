import Link from "next/link";

import { buildLearnerReviewQueue, type LearnerReviewQueue } from "@/application/education/review-queue";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { GuidedRecallSession } from "@/components/education/GuidedRecallSession";
import { SupabaseEducationalPracticeRepository } from "@/infrastructure/supabase/education/practice-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

/**
 * Guided reflection is navigation-only. It never receives stored answers and
 * cannot write practice history, missions or rewards.
 */
export default async function SessaoRevisaoPage() {
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
    // Outages are not evidence that the learner has no reviews.
  }

  return (
    <AuthenticatedShell currentPath="/pratica">
      <main className="aa-page aa-page-narrow" aria-labelledby="guided-recall-page-title">
        <header className="aa-page-header">
          <div className="aa-page-header-copy">
            <p className="aa-eyebrow">Aprendizagem · recuperação ativa</p>
            <h1 id="guided-recall-page-title">Sessão guiada de revisão</h1>
            <p>Relembre até cinco questões com revisão disponível no seu histórico, no seu ritmo.</p>
          </div>
        </header>
        {queue === null ? (
          <section className="aa-surface aa-sanctuary-section" role="alert">
            <h2>Não foi possível carregar sua sessão</h2>
            <p>Suas revisões não foram apagadas. Tente consultar novamente.</p>
            <form action="/sessao-revisao" method="get">
              <button className="aa-button aa-button-secondary" type="submit">
                Tentar novamente
              </button>
            </form>
          </section>
        ) : queue.due.length === 0 ? (
          <section className="aa-surface aa-sanctuary-section" role="status">
            <h2>Nenhuma revisão disponível agora</h2>
            <p>Este estado considera apenas suas tentativas registradas. Você pode continuar na Prática.</p>
          </section>
        ) : (
          <GuidedRecallSession
            items={queue.due.slice(0, 5).map((entry) => ({
              id: entry.practiceItemId,
              prompt: entry.prompt,
              pageTitle: entry.pageTitle,
              practiceHref: entry.href,
            }))}
          />
        )}
        <nav className="aa-action-row" aria-label="Continuar estudando">
          <Link href="/revisoes" className="aa-button aa-button-secondary">Minhas revisões</Link>
          <Link href="/pratica" className="aa-button aa-button-secondary">Ir para Prática</Link>
        </nav>
      </main>
    </AuthenticatedShell>
  );
}
