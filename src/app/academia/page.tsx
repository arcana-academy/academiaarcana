import Link from "next/link";
import { BookOpen, CalendarDays, House, type LucideIcon } from "lucide-react";

import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

const learningAreas: Array<{
  href: "/workspace" | "/cronograma" | "/santuario";
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
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
];

export default async function AcademiaPage() {
  await requireAuthenticatedUser();

  return (
    <AuthenticatedShell currentPath="/academia">
      <main className="aa-page" aria-labelledby="academia-title">
        <header className="aa-card aa-card-elevated aa-page-header">
          <p className="aa-eyebrow">Academia</p>
          <h1 id="academia-title">Sua jornada de aprendizagem</h1>
          <p>
            Um ponto de entrada para as ferramentas de estudo que já estão
            implementadas na Academia Arcana.
          </p>
        </header>

        <section aria-labelledby="academia-areas-title">
          <div className="aa-section-heading">
            <div>
              <p className="aa-eyebrow">Explorar</p>
              <h2 id="academia-areas-title">Áreas de estudo</h2>
            </div>
            <p>Escolha o contexto que corresponde ao seu próximo passo.</p>
          </div>

          <div className="aa-card-grid">
            {learningAreas.map((area) => {
              const Icon = area.icon;

              return (
                <article className="aa-card aa-card-default aa-action-card" key={area.href}>
                  <div className="aa-card-icon" aria-hidden="true">
                    <Icon size={20} strokeWidth={1.8} />
                  </div>
                  <h3>{area.title}</h3>
                  <p>{area.description}</p>
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
