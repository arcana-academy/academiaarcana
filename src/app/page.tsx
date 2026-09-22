import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

async function hasAuthenticatedSession() {
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
    <main
      aria-labelledby="home-title"
      style={{
        maxWidth: "60rem",
        margin: "0 auto",
        padding: "clamp(1.5rem, 4vw, 3rem)",
      }}
    >
      <header
        className="aa-card aa-card-elevated"
        style={{ display: "grid", gap: "var(--aa-spacing-md)" }}
      >
        <p
          style={{
            margin: 0,
            color: "var(--aa-text-secondary)",
            fontWeight: 650,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Academia Arcana
        </p>

        <h1 id="home-title" style={{ margin: 0 }}>
          Um espaço para aprender, organizar e continuar sua jornada.
        </h1>

        <p style={{ margin: 0, maxWidth: "48rem", color: "var(--aa-text-secondary)" }}>
          Reúna seus grimórios, cadernos, capítulos e páginas em um Workspace
          criado para transformar estudo em uma prática contínua.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--aa-spacing-sm)",
            marginTop: "var(--aa-spacing-sm)",
          }}
        >
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

      <section
        aria-labelledby="home-foundation-title"
        style={{
          display: "grid",
          gap: "var(--aa-spacing-md)",
          marginTop: "var(--aa-spacing-lg)",
        }}
      >
        <div className="aa-card aa-card-default">
          <h2 id="home-foundation-title">A estrutura já construída</h2>
          <p>
            O Santuário reúne seu contexto de aprendizagem, enquanto o
            Workspace guarda a hierarquia persistida de grimórios até páginas.
          </p>
        </div>

        <div className="aa-card aa-card-default">
          <h2>Comece pelo seu próximo passo</h2>
          <p>
            Entre para continuar sua jornada ou crie sua conta para começar a
            construir seu primeiro espaço de estudo.
          </p>
        </div>
      </section>
    </main>
  );
}
