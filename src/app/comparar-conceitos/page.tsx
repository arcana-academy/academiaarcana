import Link from "next/link";

import {
  buildComparisonChoices,
  projectComparisonExcerpt,
  type ConceptComparisonChoice,
  type ConceptComparisonExcerpt,
} from "@/application/education/concept-comparison";
import { ActiveConceptComparison } from "@/components/education/ActiveConceptComparison";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { SupabaseEducationalPracticeRepository } from "@/infrastructure/supabase/education/practice-repository";
import { createPageRepository } from "@/infrastructure/supabase/workspace/page-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

type Query = { a?: string | string[]; b?: string | string[] };

export default async function CompararConceitosPage({
  searchParams,
}: { searchParams: Promise<Query> }) {
  const claims = await requireAuthenticatedUser();
  const params = await searchParams;
  let choices: ConceptComparisonChoice[] | null = null;
  let comparison: [ConceptComparisonExcerpt, ConceptComparisonExcerpt] | null = null;
  let invalidSelection = false;

  try {
    const supabase = await createClient();
    const practice = new SupabaseEducationalPracticeRepository(supabase);
    choices = buildComparisonChoices(await practice.listPages(claims.sub));
    const a = params.a;
    const b = params.b;
    if (a !== undefined || b !== undefined) {
      const allowed = new Set(choices.map((option) => option.id));
      if (
        typeof a !== "string" || typeof b !== "string" ||
        a === b || !allowed.has(a) || !allowed.has(b)
      ) {
        invalidSelection = true;
      } else {
        const pages = createPageRepository(
          supabase as unknown as Parameters<typeof createPageRepository>[0],
        );
        const [first, second] = await Promise.all([
          pages.getById(a), pages.getById(b),
        ]);
        if (!first || !second) {
          throw new Error("Comparison source is unavailable.");
        }
        comparison = [
          projectComparisonExcerpt(first, a),
          projectComparisonExcerpt(second, b),
        ];
      }
    }
  } catch {
    // A failed read cannot be represented as an empty learner catalog.
    choices = null;
    comparison = null;
  }

  return (
    <AuthenticatedShell currentPath="/academia">
      <main className="aa-page aa-page-narrow" aria-labelledby="compare-title">
        <header className="aa-page-header">
          <div className="aa-page-header-copy">
            <p className="aa-eyebrow">Academia · elaboração</p>
            <h1 id="compare-title">Comparação ativa de conceitos</h1>
            <p>Compare dois conteúdos que você já salvou e formule relações com suas próprias palavras.</p>
          </div>
        </header>

        {choices === null ? (
          <section className="aa-surface aa-sanctuary-section" role="alert">
            <h2>Não foi possível ler suas páginas</h2>
            <p>Seus materiais permanecem salvos. Tente novamente.</p>
            <form action="/comparar-conceitos" method="get">
              <button type="submit" className="aa-button aa-button-secondary">Tentar novamente</button>
            </form>
          </section>
        ) : choices.length < 2 ? (
          <section className="aa-surface aa-sanctuary-section" role="status">
            <h2>São necessárias duas páginas salvas</h2>
            <p>Crie pelo menos duas páginas no Workspace para iniciar uma comparação.</p>
          </section>
        ) : (
          <>
            <section className="aa-surface aa-sanctuary-section" aria-labelledby="compare-choose-title">
              <h2 id="compare-choose-title">Selecione dois conteúdos</h2>
              <p>Mostrando até 40 páginas disponíveis em sua biblioteca pessoal.</p>
              <form className="aa-form" method="get" action="/comparar-conceitos">
                <label htmlFor="comparison-first">Primeira página</label>
                <select id="comparison-first" name="a" required defaultValue={typeof params.a === "string" && choices.some((choice) => choice.id === params.a) ? params.a : ""}>
                  <option value="" disabled>Escolha uma página</option>
                  {choices.map((choice) => <option value={choice.id} key={choice.id}>{choice.title}</option>)}
                </select>
                <label htmlFor="comparison-second">Segunda página</label>
                <select id="comparison-second" name="b" required defaultValue={typeof params.b === "string" && choices.some((choice) => choice.id === params.b) ? params.b : ""}>
                  <option value="" disabled>Escolha uma página diferente</option>
                  {choices.map((choice) => <option value={choice.id} key={choice.id}>{choice.title}</option>)}
                </select>
                <button className="aa-button aa-button-primary" type="submit">Comparar páginas</button>
              </form>
            </section>
            {invalidSelection ? (
              <p role="alert">Escolha duas páginas diferentes e disponíveis na sua biblioteca.</p>
            ) : null}
            {comparison ? <ActiveConceptComparison pages={comparison} /> : null}
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
