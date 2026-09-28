import { signOut } from "@/lib/auth/actions";
import {
  AuthenticatedNavigation,
  type AuthenticatedRouteHref,
} from "@/components/navigation/AuthenticatedNavigation";

type AuthenticatedShellProps = {
  currentPath: AuthenticatedRouteHref;
  children: React.ReactNode;
};

const pageContext: Record<AuthenticatedRouteHref, { eyebrow: string; title: string }> = {
  "/santuario": { eyebrow: "Centro de comando", title: "Santuário" },
  "/academia": { eyebrow: "Aprendizagem", title: "Academia" },
  "/grimorios": { eyebrow: "Conhecimento", title: "Grimórios" },
  "/workspace": { eyebrow: "Conhecimento", title: "Workspace" },
  "/cronograma": { eyebrow: "Planejamento", title: "Cronograma" },
  "/personalizar": { eyebrow: "Seu espaço", title: "Personalizar" },
};

export function AuthenticatedShell({ currentPath, children }: AuthenticatedShellProps) {
  const context = pageContext[currentPath];

  return (
    <div className="aa-shell">
      <a className="aa-skip-link" href="#main-content">
        Pular para o conteúdo
      </a>

      <aside className="aa-sidebar" aria-label="Navegação principal">
        <div className="aa-sidebar-brand">
          <div className="aa-brand-mark" aria-hidden="true">✦</div>
          <div>
            <p className="aa-brand-name">Academia Arcana</p>
            <p className="aa-brand-subtitle">Jornada de aprendizagem</p>
          </div>
        </div>

        <AuthenticatedNavigation currentPath={currentPath} />

        <div className="aa-sidebar-footer">
          <div className="aa-sidebar-rule" />
          <form action={signOut}>
            <button className="aa-button aa-button-ghost aa-button-sidebar" type="submit">
              Sair da Academia
            </button>
          </form>
        </div>
      </aside>

      <div className="aa-shell-main">
        <header className="aa-topbar">
          <div className="aa-topbar-context">
            <span className="aa-topbar-eyebrow">{context.eyebrow}</span>
            <p className="aa-topbar-title">{context.title}</p>
          </div>
          <div className="aa-topbar-actions" aria-label="Estado da sessão">
            <span className="aa-status-dot" aria-hidden="true" />
            <span className="aa-topbar-status">Espaço seguro</span>
          </div>
        </header>

        <div id="main-content" className="aa-main-content">
          {children}
        </div>
      </div>

      <div className="aa-mobile-nav">
        <AuthenticatedNavigation currentPath={currentPath} mobile />
      </div>
    </div>
  );
}
