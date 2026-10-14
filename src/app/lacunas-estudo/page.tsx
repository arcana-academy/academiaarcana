import Link from "next/link";
import {
  buildComparisonChoices,
  projectComparisonExcerpt,
  type ConceptComparisonChoice,
  type ConceptComparisonExcerpt,
} from "@/application/education/concept-comparison";
import { OwnedClozePractice } from "@/components/education/OwnedClozePractice";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { SupabaseEducationalPracticeRepository } from "@/infrastructure/supabase/education/practice-repository";
import { createPageRepository } from "@/infrastructure/supabase/workspace/page-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

type Query = { page?: string | string[] };

/** Read-only cloze practice, protected by the authenticated page catalog. */
export default async function LacunasEstudoPage({
  searchParams,
}: { searchParams: Promise<Query> }) {
  const claims = await requireAuthenticatedUser();
  const params = await searchParams;
  let choices: ConceptComparisonChoice[] | null = null;
  let excerpt: ConceptComparisonExcerpt | null = null;
  let invalidSelection = false;

  try {
    const supabase = await createClient();
    const practiceRepository = new SupabaseEducationalPracticeRepository(supabase);
    choices = buildComparisonChoices(await practiceRepository.listPages(claims.sub));

    if (params.page !== undefined) {
      if (
        typeof params.page !== "string" ||
        !choices.some((choice) => choice.id === params.page)
      ) {
        invalidSelection = true;
      } else {
        const repository = createPageRepository(
          supabase as unknown as Parameters<typeof createPageRepository>[0],
        );
        const saved = await repository.getById(params.page);
        if (!saved) throw new Error("Saved page unavailable.");
        excerpt = projectComparisonExcerpt(saved, params.page);
      }
    }
  } catch {
    // An outage is not a legitimate empty personal library.
    choices = null;
    excerpt = null;
  }

  return (
    <AuthenticatedShell currentPath="/academia">
      <main className="aa-page aa-page-narrow" aria-labelledby="cloze-page-title">
        <header className="aa-page-header">
          <div className="aa-page-header-copy">
            <p className="aa-eyebrow">Academia · recuperação ativa</p>
            <h1 id="cloze-page-title">Prática de lacunas</h1>
            <p>Reconstrua palavras ocultadas dos textos que você salvou no Workspace.</p>
          </div>
        </header>

        {choices === null ? (
          <section className="aa-surface aa-sanctuary-section" role="alert">
            <h2>Não foi possível consultar suas páginas</h2>
            <p>Seus materiais permanecem salvos. Você pode tentar novamente.</p>
            <form method="get" action="/lacunas-estudo">
              <button type="submit" className="aa-button aa-button-secondary">Tentar novamente</button>
            </form>
          </section>
        ) : choices.length === 0 ? (
          <section className="aa-surface aa-sanctuary-section" role="status">
            <h2>Nenhuma página salva disponível</h2>
            <p>Crie uma página no Workspace e registre conteúdo antes de praticar.</p>
          </section>
        ) : (
          <>
            <section className="aa-surface aa-sanctuary-section" aria-labelledby="cloze-select-title">
              <h2 id="cloze-select-title">Escolha seu material</h2>
              <p className="aa-state-copy">Até 40 páginas disponíveis; o texto só é lido após escolher a página.</p>
              <form action="/lacunas-estudo" method="get" className="aa-form">
                <label htmlFor="cloze-page">Página salva</label>
                <select id="cloze-page" name="page" required
                  defaultValue={typeof params.page === "string" && choices.some((choice) => choice.id === params.page) ? params.page : ""}>
                  <option value="" disabled>Selecione uma página</option>
                  {choices.map((choice) => (
                    <option key={choice.id} value={choice.id}>{choice.title}</option>
                  ))}
                </select>
                <button type="submit" className="aa-button aa-button-primary">Criar lacunas temporárias</button>
              </form>
            </section>
            {invalidSelection ? (
              <p role="alert">Escolha uma página disponível na sua biblioteca.</p>
            ) : null}
            {excerpt ? <OwnedClozePractice key={excerpt.id} page={excerpt} /> : null}
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
