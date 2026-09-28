import Link from "next/link";
import { ArrowUpRight, BookOpen, CalendarDays, House } from "lucide-react";

import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

const learningAreas = [
  { href: "/workspace", title: "Workspace", description: "Organize grimoires, notebooks, chapters and pages.", icon: BookOpen, kicker: "Conhecimento" },
  { href: "/cronograma", title: "Cronograma", description: "Planeje e acompanhe suas próximas tarefas de estudo.", icon: CalendarDays, kicker: "Planejamento" },
  { href: "/santuario", title: "Santuário", description: "Retome o contexto atual da sua jornada de aprendizagem.", icon: House, kicker: "Centro de comando" },
] as const;

export default async function AcademiaPage() {
  await requireAuthenticatedUser();

  return (
    <AuthenticatedShell currentPath="/academia">
      <div className="aa-page-stack">
        <header className="aa-page-hero">
          <div>
            <span className="aa-section-kicker">Academia</span>
            <h1 id="academia-title">Sua jornada de aprendizagem</h1>
            <p>Um ponto de entrada para as ferramentas de estudo que já estão implementadas na Academia Arcana.</p>
          </div>
          <div className="aa-page-hero-mark" aria-hidden="true">✦</div>
        </header>

        <section aria-labelledby="academia-areas-title">
          <div className="aa-section-heading">
            <div>
              <span className="aa-section-kicker">Escolha um caminho</span>
              <h2 id="academia-areas-title">Áreas de estudo</h2>
            </div>
          </div>

          <div className="aa-area-grid">
            {learningAreas.map((area) => {
              const Icon = area.icon;
              return (
                <article className="aa-area-card" key={area.href}>
                  <div className="aa-area-icon" aria-hidden="true"><Icon size={21} strokeWidth={1.8} /></div>
                  <span className="aa-area-kicker">{area.kicker}</span>
                  <h3>{area.title}</h3>
                  <p>{area.description}</p>
                  <Link className="aa-area-link" href={area.href}>
                    <span>Abrir área</span>
                    <ArrowUpRight aria-hidden="true" size={17} />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </AuthenticatedShell>
  );
}
