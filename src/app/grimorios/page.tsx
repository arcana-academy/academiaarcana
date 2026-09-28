import Link from "next/link";
import { ArrowUpRight, BookMarked } from "lucide-react";

import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import type { Grimoire } from "@/domains/learning";
import { createGrimoireRepository } from "@/infrastructure/supabase/workspace/grimoire-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

export default async function GrimoriosPage() {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  const repositoryClient = supabase as unknown as Parameters<typeof createGrimoireRepository>[0];
  const grimoires: Grimoire[] = await createGrimoireRepository(repositoryClient).listByOwner(claims.sub);

  return (
    <AuthenticatedShell currentPath="/grimorios">
      <div className="aa-page-stack">
        <header className="aa-page-hero">
          <div>
            <span className="aa-section-kicker">Biblioteca</span>
            <h1 id="grimorios-title">Seus grimórios</h1>
            <p>Acesse diretamente os espaços de estudo que você criou.</p>
          </div>
          <div className="aa-page-hero-mark" aria-hidden="true"><BookMarked size={26} strokeWidth={1.5} /></div>
        </header>

        {grimoires.length === 0 ? (
          <section className="aa-empty-panel" aria-labelledby="grimorios-empty-title">
            <span className="aa-section-kicker">Primeiro registro</span>
            <h2 id="grimorios-empty-title">Nenhum grimório ainda</h2>
            <p>Crie seu primeiro grimório no Workspace para começar sua biblioteca.</p>
            <Link className="aa-button aa-button-primary" href="/workspace">Abrir Workspace</Link>
          </section>
        ) : (
          <section aria-labelledby="grimorios-list-title">
            <div className="aa-section-heading">
              <div>
                <span className="aa-section-kicker">Sua coleção</span>
                <h2 id="grimorios-list-title">Biblioteca de estudo</h2>
              </div>
              <Link className="aa-button aa-button-secondary aa-button-sm" href="/workspace">Novo grimório</Link>
            </div>
            <div className="aa-grimoire-grid">
              {grimoires.map((grimoire) => (
                <article className="aa-grimoire-card" key={grimoire.id}>
                  <div className="aa-grimoire-seal" aria-hidden="true"><BookMarked size={21} strokeWidth={1.7} /></div>
                  <span className="aa-area-kicker">Grimório</span>
                  <h3>{grimoire.title}</h3>
                  {grimoire.description ? <p>{grimoire.description}</p> : <p>Um espaço reservado para sua jornada de conhecimento.</p>}
                  <Link className="aa-area-link" href={`/workspace?grimoire=${encodeURIComponent(grimoire.id)}`}>
                    <span>Abrir grimório</span>
                    <ArrowUpRight aria-hidden="true" size={17} />
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </AuthenticatedShell>
  );
}
