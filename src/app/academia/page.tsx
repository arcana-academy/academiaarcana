import Link from "next/link";

import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

const learningPaths = [
  {
    eyebrow: "Organização",
    title: "Organize o conhecimento",
    description: "Reúna seus estudos e estruture o que deseja aprender.",
    links: [
      {
        href: "/grimorios",
        title: "Grimórios",
        description: "Explore sua biblioteca de estudos.",
      },
      {
        href: "/workspace",
        title: "Workspace",
        description: "Estruture capítulos e páginas.",
      },
    ],
  },
  {
    eyebrow: "Planejamento",
    title: "Planeje e avance",
    description: "Transforme objetivos em próximos passos e organize seu tempo.",
    links: [
      {
        href: "/cronograma",
        title: "Cronograma",
        description: "Organize tarefas de estudo no tempo.",
      },
      {
        href: "/missoes",
        title: "Missões",
        description: "Converta objetivos em ações executáveis.",
      },
    ],
  },
  {
    eyebrow: "Estudo",
    title: "Estude e pratique",
    description: "Reserve um momento para focar e trabalhar com seus materiais.",
    links: [
      {
        href: "/foco",
        title: "Foco",
        description: "Prepare uma sessão de estudo no seu ritmo.",
      },
      {
        href: "/pratica",
        title: "Prática",
        description: "Acesse suas atividades de prática.",
      },
    ],
  },
  {
    eyebrow: "Continuidade",
    title: "Revise e retome",
    description: "Recupere o contexto e consulte os registros disponíveis.",
    links: [
      {
        href: "/santuario",
        title: "Santuário",
        description: "Veja o que importa agora na sua jornada.",
      },
      {
        href: "/estatisticas",
        title: "Estatísticas",
        description: "Acompanhe os registros de aprendizagem.",
      },
    ],
  },
] as const;

export default async function AcademiaPage() {
  await requireAuthenticatedUser();

  return (
    <AuthenticatedShell currentPath="/academia">
      <main className="aa-page aa-page-narrow academy-page" aria-labelledby="academia-title">
        <header className="aa-page-header">
          <div className="aa-page-header-copy">
            <p className="aa-eyebrow">Academia · aprendizagem</p>
            <h1 id="academia-title">Sua jornada de aprendizagem</h1>
            <p>
              Organize seus estudos, escolha um próximo passo e retome quando precisar.
            </p>
          </div>
        </header>

        <section className="academy-paths" aria-labelledby="academia-paths-title">
          <header className="academy-paths-header">
            <p className="aa-eyebrow">Caminhos de aprendizagem</p>
            <h2 id="academia-paths-title">Por onde você quer começar?</h2>
          </header>

          <div className="academy-path-groups">
            {learningPaths.map((path) => (
              <section className="aa-surface academy-path-group" key={path.title}>
                <header className="academy-path-group-header">
                  <p className="aa-eyebrow">{path.eyebrow}</p>
                  <h3>{path.title}</h3>
                  <p>{path.description}</p>
                </header>

                <ul className="academy-path-list">
                  {path.links.map((link) => (
                    <li key={link.href}>
                      <Link className="aa-button aa-button-ghost academy-path-link" href={link.href}>
                        <span className="academy-path-link-copy">
                          <strong>{link.title}</strong>
                          <small>{link.description}</small>
                        </span>
                        <span className="academy-path-link-arrow" aria-hidden="true">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </section>
      </main>
    </AuthenticatedShell>
  );
}
