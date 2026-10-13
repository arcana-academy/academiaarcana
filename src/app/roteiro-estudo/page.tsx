import Link from "next/link";

import { buildStudyItineraryPages } from "@/application/education/study-itinerary";
import { StudyItineraryPlanner } from "@/components/education/StudyItineraryPlanner";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { SupabaseEducationalPracticeRepository } from "@/infrastructure/supabase/education/practice-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

/** Authenticated, read-only study itinerary from persisted learner materials. */
export default async function RoteiroEstudoPage() {
  const claims = await requireAuthenticatedUser();
  let pages: ReturnType<typeof buildStudyItineraryPages> | null = null;

  try {
    const client = await createClient();
    const repository = new SupabaseEducationalPracticeRepository(client);
    const [savedPages, practiceItems] = await Promise.all([
      repository.listPages(claims.sub),
      repository.listPracticeItems(claims.sub),
    ]);
    pages = buildStudyItineraryPages(claims.sub, savedPages, practiceItems);
  } catch {
    // A failed read is never interpreted as an empty personal library.
  }

  return (
    <AuthenticatedShell currentPath="/academia">
      <main className="aa-page aa-page-narrow" aria-labelledby="study-itinerary-title">
        <header className="aa-page-header">
          <div className="aa-page-header-copy">
            <p className="aa-eyebrow">Academia · estudo autodirigido</p>
            <h1 id="study-itinerary-title">Roteiro de estudo</h1>
            <p>Monte uma sequência com suas páginas salvas, sem gerar compromissos ou registros automáticos.</p>
          </div>
        </header>
        {pages === null ? (
          <section className="aa-surface aa-sanctuary-section" role="alert">
            <h2>Não foi possível carregar suas páginas</h2>
            <p>Seus materiais não foram apagados. Tente novamente.</p>
            <form action="/roteiro-estudo" method="get">
              <button className="aa-button aa-button-secondary" type="submit">Tentar novamente</button>
            </form>
          </section>
        ) : pages.length === 0 ? (
          <section className="aa-surface aa-sanctuary-section" role="status">
            <h2>Nenhuma página salva disponível</h2>
            <p>Crie uma página no Workspace para organizar seu próximo roteiro.</p>
          </section>
        ) : (
          <>
            <p className="aa-state-copy">
              Exibindo até 30 páginas salvas disponíveis, sem conteúdo privado de respostas ou tentativas.
            </p>
            <StudyItineraryPlanner pages={pages} />
          </>
        )}
        <nav className="aa-action-row" aria-label="Navegação de estudo">
          <Link href="/academia" className="aa-button aa-button-secondary">Voltar à Academia</Link>
          <Link href="/workspace" className="aa-button aa-button-secondary">Abrir Workspace</Link>
        </nav>
      </main>
    </AuthenticatedShell>
  );
}
