import Link from "next/link";
import { BookOpen, CalendarDays, House } from "lucide-react";

import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

const learningAreas = [
  {
    href: "/workspace",
    title: "Workspace",
    description: "Organize grimórios, cadernos, capítulos e páginas.",
    icon: BookOpen,
  },
  {
    href: "/cronograma",
    title: "Cronograma",
    description: "Planeje e acompanhe suas próximas tarefas de estudo.",
    icon: CalendarDays,
  },
  {
    href: "/santuario",
    title: "Santuário",
    description: "Retome o contexto atual da sua jornada de aprendizagem.",
    icon: House,
  },
] as const;

export default async function AcademiaPage() {
  await requireAuthenticatedUser();

  return (
    <AuthenticatedShell currentPath="/academia">
      <main
        className="aa-page aa-page-wide"
        aria-labelledby="academia-title"
      >
        <header className="aa-card aa-card-elevated aa-page-header">
          <p className="aa-eyebrow">Academia</p>
          <h1 id="academia-title">Sua jornada de aprendizagem</h1>
          <p className="aa-page-intro">
            Um ponto de entrada para as ferramentas de estudo que já estão
            implementadas na Academia Arcana.
          </p>
        </header>

        <section
          className="aa-section"
          aria-labelledby="academia-areas-title"
        >
          <header className="aa-page-header">
            <h2 id="academia-areas-title">Áreas de estudo</h2>
            <p className="aa-page-intro">
              Acesse apenas áreas que já possuem uma experiência funcional no
              projeto atual.
            </p>
          </header>

          <div className="aa-card-grid">
            {learningAreas.map((area) => {
              const Icon = area.icon;

              return (
                <article className="aa-card aa-card-default aa-feature-card" key={area.href}>
                  <div className="aa-feature-icon" aria-hidden="true">
                    <Icon size={22} strokeWidth={1.8} />
                  </div>
                  <div className="aa-section">
                    <h3>{area.title}</h3>
                    <p>{area.description}</p>
                  </div>
                  <Link className="aa-button aa-button-secondary" href={area.href}>
                    Abrir
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </AuthenticatedShell>
  );
}
