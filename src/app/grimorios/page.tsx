import Link from "next/link";
import { BookOpen } from "lucide-react";

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
  const grimoires: Grimoire[] =
    await createGrimoireRepository(repositoryClient).listByOwner(claims.sub);

  return (
    <AuthenticatedShell currentPath="/grimorios">
      <main className="aa-page" aria-labelledby="grimorios-title">
        <header className="aa-card aa-card-elevated aa-page-header">
          <p className="aa-eyebrow">Biblioteca</p>
          <h1 id="grimorios-title">Seus grimórios</h1>
          <p>Acesse diretamente os espaços de estudo que você criou.</p>
        </header>

        {grimoires.length === 0 ? (
          <section
            className="aa-card aa-card-default aa-empty-state"
            aria-labelledby="grimorios-empty-title"
          >
            <div className="aa-card-icon" aria-hidden="true">
              <BookOpen size={20} strokeWidth={1.8} />
            </div>
            <h2 id="grimorios-empty-title">Nenhum grimório ainda</h2>
            <p>
              Crie seu primeiro grimório no Workspace para começar sua
              biblioteca.
            </p>
            <Link className="aa-button aa-button-primary" href="/workspace">
              Abrir Workspace
            </Link>
          </section>
        ) : (
          <section aria-labelledby="grimorios-list-title">
            <div className="aa-section-heading">
              <div>
                <p className="aa-eyebrow">Biblioteca de estudo</p>
                <h2 id="grimorios-list-title">Seus espaços</h2>
              </div>
              <p>{grimoires.length} grimório(s) disponível(is).</p>
            </div>

            <div className="aa-card-grid">
              {grimoires.map((grimoire) => (
                <article className="aa-card aa-card-default aa-action-card" key={grimoire.id}>
                  <div className="aa-card-icon" aria-hidden="true">
                    <BookOpen size={20} strokeWidth={1.8} />
                  </div>
                  <h3>{grimoire.title}</h3>
                  {grimoire.description ? <p>{grimoire.description}</p> : null}
                  <Link
                    className="aa-button aa-button-secondary"
                    href={"/workspace?grimoire=" + encodeURIComponent(grimoire.id)}
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
