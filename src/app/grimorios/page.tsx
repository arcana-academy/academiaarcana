import Image from "next/image";
import Link from "next/link";

import { getWorkspaceCanonicalHref } from "@/application/learning/workspace/state";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import type { Grimoire } from "@/domains/learning";
import { createGrimoireRepository } from "@/infrastructure/supabase/workspace/grimoire-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

export default async function GrimoiresPage() {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  const repositoryClient = supabase as unknown as Parameters<
    typeof createGrimoireRepository
  >[0];

  let grimoires: Grimoire[] = [];
  let loadError = false;

  try {
    grimoires = await createGrimoireRepository(repositoryClient).listByOwner(claims.sub);
  } catch {
    loadError = true;
  }

  return (
    <AuthenticatedShell currentPath="/grimorios">
      <main className="aa-page" aria-labelledby="grimorios-title">
        <header className="aa-page-header">
          <div className="aa-page-header-knowledge">
            <Image
              className="aa-knowledge-mark"
              src="/assets/icons/aa-library-mark.svg"
              alt=""
              width={52}
              height={52}
              priority
            />
            <div className="aa-page-header-copy">
              <p className="aa-eyebrow">Biblioteca · conhecimento</p>
              <h1 id="grimorios-title">Grimórios</h1>
              <p>Sua biblioteca pessoal de estudos e conhecimentos, organizada para voltar ao que importa.</p>
            </div>
          </div>
        </header>

        {loadError ? (
          <section className="aa-surface aa-sanctuary-section grimoires-library-state" role="alert">
            <p className="aa-eyebrow">Biblioteca</p>
            <h2>Não foi possível carregar os grimórios</h2>
            <p>A biblioteca não foi atualizada. Tente carregar novamente.</p>
            <form action="/grimorios" method="get">
              <button className="aa-button aa-button-ghost" type="submit">
                Tentar novamente
              </button>
            </form>
          </section>
        ) : grimoires.length === 0 ? (
          <section className="aa-surface aa-sanctuary-section grimoires-library-state" aria-labelledby="grimorios-empty-title">
            <p className="aa-eyebrow">Sua biblioteca</p>
            <h2 id="grimorios-empty-title">Nenhum grimório ainda</h2>
            <p>Crie seu primeiro grimório para organizar seus estudos e reunir o conhecimento que deseja desenvolver.</p>
            <Link className="aa-button aa-button-primary" href="/workspace">
              Criar primeiro grimório
            </Link>
          </section>
        ) : (
          <section className="grimoires-library" aria-labelledby="grimorios-list-title">
            <header className="grimoires-library-header">
              <div>
                <h2 id="grimorios-list-title">Sua biblioteca</h2>
                <p>
                  {grimoires.length} {grimoires.length === 1 ? "grimório" : "grimórios"}
                </p>
              </div>
              <Link className="aa-button aa-button-primary" href="/workspace">
                Novo grimório
              </Link>
            </header>

            <ul className="grimoires-library-list" aria-label="Seus grimórios">
              {grimoires.map((grimoire) => (
                <li className="grimoires-library-item" key={grimoire.id}>
                  <article className="aa-surface grimoires-library-card">
                    <div className="aa-grimoire-item-visual" aria-hidden="true">
                      <Image
                        src="/assets/grimoires/aa-grimoire-cover-base.svg"
                        alt=""
                        width={96}
                        height={132}
                      />
                    </div>
                    <div className="aa-grimoire-item-copy">
                      <p className="aa-eyebrow">Grimório</p>
                      <h3>{grimoire.title}</h3>
                      {grimoire.description ? <p>{grimoire.description}</p> : null}
                    </div>
                    <Link
                      className="aa-button aa-button-ghost grimoires-library-open"
                      href={getWorkspaceCanonicalHref({
                        grimoireId: grimoire.id,
                        notebookId: null,
                        chapterId: null,
                        pageId: null,
                      })}
                    >
                      Abrir grimório
                    </Link>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </AuthenticatedShell>
  );
}
