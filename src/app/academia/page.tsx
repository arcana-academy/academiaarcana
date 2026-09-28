import Link from "next/link";

import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

const learningAreas = [
  {
    href: "/workspace",
    title: "Workspace",
    description: "Organize grimoires, notebooks, chapters and pages.",
  },
  {
    href: "/cronograma",
    title: "Cronograma",
    description: "Planeje e acompanhe suas próximas tarefas de estudo.",
  },
  {
    href: "/santuario",
    title: "Santuário",
    description: "Retome o contexto atual da sua jornada de aprendizagem.",
  },
] as const;

export default async function AcademiaPage() {
  await requireAuthenticatedUser();

  return (
    <AuthenticatedShell currentPath="/academia">
      <main aria-labelledby="academia-title" className="aa-page">
        <header className="aa-card aa-card-elevated">
          <p className="aa-eyebrow">Academia</p>
          <h1 id="academia-title">Sua jornada de aprendizagem</h1>
          <p className="aa-text-secondary">
            Um ponto de entrada para as ferramentas de estudo que já estão
            implementadas na Academia Arcana.
          </p>
        </header>

        <section aria-labelledby="academia-areas-title" className="aa-section">
          <h2 id="academia-areas-title">Áreas de estudo</h2>
          <div className="aa-grid">
            {learningAreas.map((area) => (
              <article className="aa-card aa-card-default" key={area.href}>
                <h3>{area.title}</h3>
                <p className="aa-text-secondary">{area.description}</p>
                <Link className="aa-button aa-button-secondary" href={area.href}>
                  Abrir
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </AuthenticatedShell>
  );
}
