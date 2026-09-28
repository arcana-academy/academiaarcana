import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

async function hasAuthenticatedSession(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    return Boolean(data?.claims?.sub);
  } catch {
    return false;
  }
}

/** Render the public entry point, redirecting authenticated users to the Sanctuary. */
export default async function Page() {
  if (await hasAuthenticatedSession()) {
    redirect("/santuario");
  }

  return (
    <main className="aa-page aa-page-wide" aria-labelledby="home-title">
      <header className="aa-card aa-card-elevated aa-page-header">
        <p className="aa-eyebrow">Academia Arcana</p>
        <h1 id="home-title">
          Um espaço para aprender, organizar e continuar sua jornada.
        </h1>
        <p className="aa-page-intro">
          Reúna seus grimórios, cadernos, capítulos e páginas em um Workspace
          criado para transformar estudo em uma prática contínua.
        </p>

        <div className="aa-actions">
          <Link className="aa-button aa-button-primary aa-button-lg" href="/login">
            Entrar
          </Link>
          <Link
            className="aa-button aa-button-secondary aa-button-lg"
            href="/cadastro"
          >
            Criar conta
          </Link>
        </div>
      </header>

      <section className="aa-section" aria-labelledby="home-foundation-title">
        <div className="aa-card-grid">
          <article className="aa-card aa-card-default">
            <h2 id="home-foundation-title">A estrutura já construída</h2>
            <p>
              O Santuário reúne seu contexto de aprendizagem, enquanto o
              Workspace guarda a hierarquia persistida de grimórios até páginas.
            </p>
          </article>

          <article className="aa-card aa-card-default">
            <h2>Comece pelo seu próximo passo</h2>
            <p>
              Entre para continuar sua jornada ou crie sua conta para começar a
              construir seu primeiro espaço de estudo.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
