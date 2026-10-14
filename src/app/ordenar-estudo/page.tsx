import Link from "next/link";

import {
  buildComparisonChoices,
  projectComparisonExcerpt,
  type ConceptComparisonChoice,
  type ConceptComparisonExcerpt,
} from "@/application/education/concept-comparison";
import { BlockSequencePractice } from "@/components/education/BlockSequencePractice";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { SupabaseEducationalPracticeRepository } from "@/infrastructure/supabase/education/practice-repository";
import { createPageRepository } from "@/infrastructure/supabase/workspace/page-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

type Query = { page?: string | string[] };

/** Only a learner's verified, RLS-visible saved page can be sequenced. */
export default async function OrdenarEstudoPage({
  searchParams,
}: { searchParams: Promise<Query> }) {
  const claims = await requireAuthenticatedUser();
  const params = await searchParams;
  let choices: ConceptComparisonChoice[] | null = null;
  let excerpt: ConceptComparisonExcerpt | null = null;
  let invalidSelection = false;

  try {
    const supabase = await createClient();
    const practice = new SupabaseEducationalPracticeRepository(supabase);
    choices = buildComparisonChoices(await practice.listPages(claims.sub));

    if (params.page !== undefined) {
      if (typeof params.page !== "string" ||
          !choices.some((choice) => choice.id === params.page)) {
        invalidSelection = true;
      } else {
        const pages = createPageRepository(
          supabase as unknown as Parameters<typeof createPageRepository>[0],
        );
        const saved = await pages.getById(params.page);
        if (!saved) throw new Error("Saved page unavailable.");
        excerpt = projectComparisonExcerpt(saved, params.page);
      }
    }
  } catch {
    // A failed read is not an empty library and must not leak provider details.
    choices = null;
    excerpt = null;
  }

  return (
    <AuthenticatedShell currentPath="/academia">
      <main className="aa-page aa-page-narrow" aria-labelledby="sequence-page-title">
        <header className="aa-page-header">
          <div className="aa-page-header-copy">
            <p className="aa-eyebrow">Academia · organização da memória</p>
            <h1 id="sequence-page-title">Sequência de estudo</h1>
            <p>Reorganize trechos que você salvou para recordar a lógica do conteúdo.</p>
          </div>
        </header>
        {choices === null ? (
          <section className="aa-surface aa-sanctuary-section" role="alert">
            <h2>Não foi possível consultar suas páginas</h2>
            <p>Seus materiais permanecem salvos. Tente novamente.</p>
            <form method="get" action="/ordenar-estudo">
              <button className="aa-button aa-button-secondary" type="submit">Tentar novamente</button>
            </form>
          </section>
        ) : choices.length === 0 ? (
          <section className="aa-surface aa-sanctuary-section" role="status">
            <h2>Nenhuma página salva disponível</h2>
            <p>Crie uma página no Workspace e registre conteúdo antes de praticar.</p>
          </section>
        ) : (
          <>
            <section className="aa-surface aa-sanctuary-section" aria-labelledby="sequence-select-title">
              <h2 id="sequence-select-title">Escolha sua página</h2>
              <p className="aa-state-copy">Até 40 páginas disponíveis; os trechos só são lidos após a escolha.</p>
              <form action="/ordenar-estudo" method="get" className="aa-form">
                <label htmlFor="sequence-page">Página salva</label>
                <select id="sequence-page" name="page" required
                  defaultValue={typeof params.page === "string" && choices.some((choice) => choice.id === params.page) ? params.page : ""}>
                  <option value="" disabled>Selecione uma página</option>
                  {choices.map((choice) => (
                    <option value={choice.id} key={choice.id}>{choice.title}</option>
                  ))}
                </select>
                <button className="aa-button aa-button-primary" type="submit">Praticar sequência temporária</button>
              </form>
            </section>
            {invalidSelection ? <p role="alert">Escolha uma página disponível na sua biblioteca.</p> : null}
            {excerpt ? <BlockSequencePractice key={excerpt.id} page={excerpt} /> : null}
          </>
        )}
        <nav className="aa-action-row" aria-label="Continuar estudando">
          <Link className="aa-button aa-button-secondary" href="/academia">Voltar à Academia</Link>
          <Link className="aa-button aa-button-secondary" href="/workspace">Abrir Workspace</Link>
        </nav>
      </main>
    </AuthenticatedShell>
  );
}
