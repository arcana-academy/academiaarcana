import Link from "next/link";
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
      <main className="aa-page" aria-labelledby="grimorios-title">
        <header className="aa-page-header">
          <div className="aa-page-header-copy">
            <p className="aa-eyebrow">Biblioteca · conhecimento</p>
            <h1 id="grimorios-title">Grimórios</h1>
            <p>Sua biblioteca pessoal de estudos e conhecimentos, organizada para voltar ao que importa.</p>
          </div>
          <Link className="aa-button aa-button-primary" href="/workspace">Novo espaço</Link>
        </header>

        <section className="aa-stat-grid" aria-label="Resumo da biblioteca">
          <div className="aa-stat"><span className="aa-stat-label">Grimórios</span><div className="aa-stat-value">{grimoires.length}</div><div className="aa-stat-meta">espaços de estudo</div></div>
          <div className="aa-stat"><span className="aa-stat-label">Biblioteca</span><div className="aa-stat-value">Pessoal</div><div className="aa-stat-meta">dados vinculados à sua conta</div></div>
          <div className="aa-stat"><span className="aa-stat-label">Próximo passo</span><div className="aa-stat-value">Explorar</div><div className="aa-stat-meta">abra um grimório para continuar</div></div>
        </section>

        {grimoires.length === 0 ? (
          <section className="aa-surface aa-sanctuary-section" aria-labelledby="grimorios-empty-title">
            <p className="aa-eyebrow">Primeiro capítulo</p>
            <h2 id="grimorios-empty-title">Sua biblioteca ainda está vazia</h2>
            <p>Crie seu primeiro grimório no Workspace para começar a construir seu espaço de conhecimento.</p>
            <Link className="aa-button aa-button-primary" href="/workspace">Abrir Workspace</Link>
          </section>
        ) : (
          <section className="aa-surface aa-sanctuary-section" aria-labelledby="grimorios-list-title">
            <div className="aa-surface-header">
              <div><p className="aa-eyebrow">Coleção</p><h2 id="grimorios-list-title">Seus grimórios</h2></div>
            </div>
            <div className="aa-stat-grid">
              {grimoires.map((grimoire) => (
                <article className="aa-surface aa-sanctuary-section" key={grimoire.id}>
                  <span className="aa-eyebrow">Grimório</span>
                  <h3>{grimoire.title}</h3>
                  {grimoire.description ? <p>{grimoire.description}</p> : null}
                  <Link className="aa-button aa-button-secondary" href={`/workspace?grimoire=${encodeURIComponent(grimoire.id)}`}>Abrir grimório</Link>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </AuthenticatedShell>
  );
}
