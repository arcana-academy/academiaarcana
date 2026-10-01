import Image from "next/image";
import Link from "next/link";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

const learningAreas = [
  { href: "/workspace", title: "Workspace", description: "Organize grimórios, cadernos, capítulos e páginas.", icon: "/assets/icons/aa-workspace.svg" },
  { href: "/cronograma", title: "Cronograma", description: "Planeje e acompanhe suas próximas tarefas de estudo.", icon: "/assets/icons/aa-cronograma.svg" },
  { href: "/santuario", title: "Santuário", description: "Retome o contexto atual da sua jornada de aprendizagem.", icon: "/assets/icons/aa-sanctuary.svg" },
] as const;

/** Render the authenticated learning-area landing page. */
export default async function AcademiaPage() {
  await requireAuthenticatedUser();

  return (
    <AuthenticatedShell currentPath="/academia">
      <main className="aa-page aa-page-narrow" aria-labelledby="academia-title">
        <header className="aa-page-header">
          <div className="aa-page-header-copy">
            <p className="aa-eyebrow">Academia · aprendizagem</p>
            <h1 id="academia-title">Sua jornada de aprendizagem</h1>
            <p>Um ponto de entrada para os espaços que sustentam seu estudo dentro da Academia Arcana.</p>
          </div>
        </header>

        <section className="aa-stat-grid" aria-label="Visão da Academia">
          <div className="aa-stat"><span className="aa-stat-label">Ambiente</span><div className="aa-stat-value">Arcana</div><div className="aa-stat-meta">Seu espaço de estudo</div></div>
          <div className="aa-stat"><span className="aa-stat-label">Estrutura</span><div className="aa-stat-value">Modular</div><div className="aa-stat-meta">Ferramentas conectadas</div></div>
          <div className="aa-stat"><span className="aa-stat-label">Foco</span><div className="aa-stat-value">Seu ritmo</div><div className="aa-stat-meta">Sem excesso de ruído</div></div>
        </section>

        <section className="aa-surface aa-sanctuary-section" aria-labelledby="academia-areas-title">
          <div className="aa-surface-header">
            <div>
              <p className="aa-eyebrow">Portas de entrada</p>
              <h2 id="academia-areas-title">Áreas de estudo</h2>
            </div>
          </div>
          <div className="aa-stat-grid">
            {learningAreas.map((area) => (
              <article className="aa-surface aa-sanctuary-section" key={area.href}>
                <Image className="aa-learning-area-icon" src={area.icon} alt="" width={64} height={64} />
                <h3>{area.title}</h3>
                <p>{area.description}</p>
                <Link className="aa-button aa-button-secondary" href={area.href}>Abrir</Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </AuthenticatedShell>
  );
}
