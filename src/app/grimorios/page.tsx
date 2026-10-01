import Image from "next/image";
import Link from "next/link";

import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import type { Grimoire } from "@/domains/learning";
import { createGrimoireRepository } from "@/infrastructure/supabase/workspace/grimoire-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

/** Render the authenticated Grimoire library. */
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
          <Link className="aa-button aa-button-primary" href="/workspace">Novo espaço</Link>
        </header>

        <section className="aa-stat-grid" aria-label="Resumo da biblioteca">
          <div className="aa-stat">
            <span className="aa-stat-label">Grimórios</span>
            <div className="aa-stat-value">{grimoires.length}</div>
            <div className="aa-stat-meta">espaços de estudo</div>
          </div>
          <div className="aa-stat">
            <span className="aa-stat-label">Biblioteca</span>
            <div className="aa-stat-value">Pessoal</div>
            <div className="aa-stat-meta">dados vinculados à sua conta</div>
          </div>
          <div className="aa-stat">
            <span className="aa-stat-label">Próximo passo</span>
            <div className="aa-stat-value">Explorar</div>
            <div className="aa-stat-meta">abra um grimório para continuar</div>
          </div>
        </section>

        {loadError ? (
          <section className="aa-surface aa-sanctuary-section" role="alert">
            <p className="aa-eyebrow">Biblioteca</p>
            <h2>Não foi possível carregar os grimórios</h2>
            <p>Tente novamente em alguns instantes.</p>
          </section>
        ) : grimoires.length === 0 ? (
          <section className="aa-surface aa-sanctuary-section" aria-labelledby="grimorios-empty-title">
            <p className="aa-eyebrow">Primeiro capítulo</p>
            <h2 id="grimorios-empty-title">Nenhum grimório ainda</h2>
            <p>Sua biblioteca está pronta para receber seu primeiro grimório. Crie-o no Workspace para começar a construir seu espaço de conhecimento.</p>
            <Link className="aa-button aa-button-primary" href="/workspace">Abrir Workspace</Link>
          </section>
        ) : (
          <section className="aa-list" aria-label="Seus grimórios">
            {grimoires.map((grimoire) => (
              <article className="aa-list-item aa-surface" key={grimoire.id}>
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
                  <h2>{grimoire.title}</h2>
                  {grimoire.description ? <p>{grimoire.description}</p> : null}
                </div>
                <Link
                  className="aa-button aa-button-ghost"
                  href={`/workspace?grimoire=${encodeURIComponent(grimoire.id)}`}
                >
                  Abrir grimório
                </Link>
              </article>
            ))}
          </section>
        )}
      </main>
    </AuthenticatedShell>
  );
}
