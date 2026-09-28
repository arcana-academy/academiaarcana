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

export default async function Page() {
  if (await hasAuthenticatedSession()) redirect("/santuario");

  return (
    <main className="aa-public-page" aria-labelledby="home-title">
      <div className="aa-public-orbit" aria-hidden="true">✦</div>
      <header className="aa-public-hero">
        <p className="aa-eyebrow">Academia Arcana</p>
        <h1 id="home-title">Seu espaço para aprender, organizar e continuar sua jornada.</h1>
        <p>
          Uma experiência de estudo construída para transformar conhecimento em prática contínua,
          reunindo seus espaços de estudo em um ambiente calmo, profundo e personalizável.
        </p>
        <div className="aa-public-actions">
          <Link className="aa-button aa-button-primary aa-button-lg" href="/login">Entrar</Link>
          <Link className="aa-button aa-button-secondary aa-button-lg" href="/cadastro">Criar conta</Link>
        </div>
      </header>

      <section className="aa-public-grid" aria-label="Pilares da Academia Arcana">
        <article className="aa-public-card">
          <span aria-hidden="true">◇</span>
          <h2>Santuário</h2>
          <p>Seu ponto de retorno para contexto, progresso e próximo passo.</p>
        </article>
        <article className="aa-public-card">
          <span aria-hidden="true">✧</span>
          <h2>Grimórios</h2>
          <p>Organize seus estudos em uma biblioteca que acompanha sua jornada.</p>
        </article>
        <article className="aa-public-card">
          <span aria-hidden="true">◈</span>
          <h2>Seu ritmo</h2>
          <p>Planeje, personalize e ajuste a experiência para estudar com mais clareza.</p>
        </article>
      </section>
    </main>
  );
}
