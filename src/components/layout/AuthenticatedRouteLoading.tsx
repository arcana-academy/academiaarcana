import type { AuthenticatedRouteHref } from "@/config/navigation";
import { AuthenticatedShell } from "./AuthenticatedShell";

type AuthenticatedRouteLoadingProps = {
  currentPath: AuthenticatedRouteHref;
  eyebrow: string;
  title: string;
};

export function AuthenticatedRouteLoading({
  currentPath,
  eyebrow,
  title,
}: AuthenticatedRouteLoadingProps) {
  const titleId = `${currentPath.slice(1)}-loading-title`;

  return (
    <AuthenticatedShell currentPath={currentPath}>
      <main
        className="aa-page"
        aria-busy="true"
        aria-labelledby={titleId}
      >
        <header className="aa-card aa-card-elevated aa-page-header">
          <p className="aa-eyebrow">{eyebrow}</p>
          <h1 id={titleId}>{title}</h1>
          <p role="status">Carregando seu conteúdo…</p>
        </header>

        <section
          className="aa-card-grid"
          aria-hidden="true"
        >
          {["primary", "secondary", "tertiary"].map((key) => (
            <div
              className="aa-card aa-card-default aa-skeleton-card"
              key={key}
            >
              <div className="aa-skeleton-title" />
              <div className="aa-skeleton-line" />
              <div className="aa-skeleton-block" />
            </div>
          ))}
        </section>
      </main>
    </AuthenticatedShell>
  );
}
