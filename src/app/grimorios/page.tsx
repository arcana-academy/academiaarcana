import Link from "next/link";

import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import type { Grimoire } from "@/domains/learning";
import { createGrimoireRepository } from "@/infrastructure/supabase/workspace/grimoire-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

export default async function GrimoriosPage() {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  const repositoryClient = supabase as unknown as Parameters<
    typeof createGrimoireRepository
  >[0];
  const grimoires: Grimoire[] = await createGrimoireRepository(repositoryClient).listByOwner(
    claims.sub,
  );

  return (
    <AuthenticatedShell currentPath="/grimorios">
      <main
        aria-labelledby="grimorios-title"
        style={{
          display: "grid",
          gap: "var(--aa-spacing-lg)",
          maxWidth: "72rem",
          margin: "0 auto",
          padding: "clamp(1.5rem, 4vw, 3rem)",
        }}
      >
        <header className="aa-card aa-card-elevated">
          <p
            style={{
              margin: 0,
              color: "var(--aa-text-secondary)",
              fontWeight: 650,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Biblioteca
          </p>
          <h1 id="grimorios-title">Seus grimórios</h1>
          <p style={{ color: "var(--aa-text-secondary)" }}>
            Acesse diretamente os espaços de estudo que você criou.
          </p>
        </header>

        {grimoires.length === 0 ? (
          <section className="aa-card aa-card-default" aria-labelledby="grimorios-empty-title">
            <h2 id="grimorios-empty-title">Nenhum grimório ainda</h2>
            <p style={{ color: "var(--aa-text-secondary)" }}>
              Crie seu primeiro grimório no Workspace para começar sua biblioteca.
            </p>
            <Link className="aa-button aa-button-primary" href="/workspace">
              Abrir Workspace
            </Link>
          </section>
        ) : (
          <section aria-labelledby="grimorios-list-title" style={{ display: "grid", gap: "var(--aa-spacing-md)" }}>
            <h2 id="grimorios-list-title">Biblioteca de estudo</h2>
            <div
              style={{
                display: "grid",
                gap: "var(--aa-spacing-md)",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 18rem), 1fr))",
              }}
            >
              {grimoires.map((grimoire) => (
                <article className="aa-card aa-card-default" key={grimoire.id}>
                  <h3>{grimoire.title}</h3>
                  {grimoire.description ? (
                    <p style={{ color: "var(--aa-text-secondary)" }}>{grimoire.description}</p>
                  ) : null}
                  <Link
                    className="aa-button aa-button-secondary"
                    href={`/workspace?grimoire=${encodeURIComponent(grimoire.id)}`}
                  >
                    Abrir grimório
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </AuthenticatedShell>
  );
}
