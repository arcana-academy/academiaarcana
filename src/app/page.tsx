import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";
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

export default async function Page() {
  if (await hasAuthenticatedSession()) {
    redirect("/santuario");
  }

  return (
    <main className="aa-public-page" aria-labelledby="home-title">
      <div className="aa-public-frame">
        <header className="aa-card aa-card-elevated aa-hero">
          <div className="aa-hero-mark" aria-hidden="true">
            <Sparkles size={22} strokeWidth={1.7} />
          </div>
          <p className="aa-eyebrow">Academia Arcana</p>
          <h1 id="home-title">
            Um espaço para aprender, organizar e continuar sua jornada.
          </h1>
          <p className="aa-hero-copy">
            Reúna seus grimórios, cadernos, capítulos e páginas em um workspace
            criado para transformar estudo em uma prática contínua.
          </p>

          <div className="aa-form-actions">
            <Link className="aa-button aa-button-primary aa-button-lg" href="/login">
              Entrar
            </Link>
            <Link className="aa-button aa-button-secondary aa-button-lg" href="/cadastro">
              Criar conta
            </Link>
          </div>
        </header>

        <section className="aa-card-grid" aria-labelledby="home-foundation-title">
          <article className="aa-card aa-card-default">
            <div className="aa-card-icon" aria-hidden="true">
              <BookOpen size={20} strokeWidth={1.8} />
            </div>
            <h2 id="home-foundation-title">A estrutura já construída</h2>
            <p>
              O Santuário reúne seu contexto de aprendizagem, enquanto o
              Workspace guarda a hierarquia persistida de grimórios até páginas.
            </p>
          </article>

          <article className="aa-card aa-card-default">
            <div className="aa-card-icon" aria-hidden="true">
              <Sparkles size={20} strokeWidth={1.8} />
            </div>
            <h2>Comece pelo seu próximo passo</h2>
            <p>
              Entre para continuar sua jornada ou crie sua conta para começar
              a construir seu primeiro espaço de estudo.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
