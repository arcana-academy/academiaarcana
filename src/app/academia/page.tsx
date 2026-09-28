import Link from "next/link";

import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

const learningAreas = [
  { href: "/workspace", title: "Workspace", description: "Organize grimoires, notebooks, chapters and pages." },
  { href: "/cronograma", title: "Cronograma", description: "Planeje e acompanhe suas próximas tarefas de estudo." },
  { href: "/santuario", title: "Santuário", description: "Retome o contexto atual da sua jornada de aprendizagem." },
] as const;

export default async function AcademiaPage() {
  await requireAuthenticatedUser();

  return (
    <AuthenticatedShell currentPath="/academia">
      <main
        aria-labelledby="academia-title"
        style={{
          display: "grid",
          gap: "var(--aa-spacing-lg)",
          maxWidth: "72rem",
          margin: "0 auto",
          padding: "clamp(1.5rem, 4vw, 3rem)",
        }}
      >
        <header className="aa-card aa-card-elevated">
          <p style={{ margin: 0, color: "var(--aa-text-secondary)", fontWeight: 650, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Academia
          </p>
          <h1 id="academia-title">Sua jornada de aprendizagem</h1>
          <p style={{ color: "var(--aa-text-secondary)" }}>
            Um ponto de entrada para as ferramentas de estudo que já estão implementadas na Academia Arcana.
          </p>
        </header>

        <section aria-labelledby="academia-areas-title" style={{ display: "grid", gap: "var(--aa-spacing-md)" }}>
          <h2 id="academia-areas-title">Áreas de estudo</h2>
          <div style={{ display: "grid", gap: "var(--aa-spacing-md)", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 18rem), 1fr))" }}>
            {learningAreas.map((area) => (
              <article className="aa-card aa-card-default" key={area.href}>
                <h3>{area.title}</h3>
                <p style={{ color: "var(--aa-text-secondary)" }}>{area.description}</p>
                <Link className="aa-button aa-button-secondary" href={area.href}>Abrir</Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </AuthenticatedShell>
  );
}
