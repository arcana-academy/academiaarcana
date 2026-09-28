import { signOut } from "@/lib/auth/actions";
import type { NavigationItem } from "@/config/navigation";

import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { Sidebar } from "@/components/layout/Sidebar";

type AuthenticatedShellProps = {
  currentPath: NavigationItem["href"];
  children: React.ReactNode;
};

export function AuthenticatedShell({ currentPath, children }: AuthenticatedShellProps) {
  return (
    <div className="aa-shell">
      <header className="aa-topbar">
        <div className="aa-topbar-brand">
          <span className="aa-brand-symbol" aria-hidden="true">✦</span>
          <div>
            <p className="aa-app-brand">Academia Arcana</p>
            <p className="aa-app-context">Jornada de aprendizagem</p>
          </div>
        </div>
        <form action={signOut}>
          <button className="aa-button aa-button-secondary aa-button-sm" type="submit">Sair</button>
        </form>
      </header>

      <div className="aa-shell-body">
        <Sidebar currentPath={currentPath} />
        <div className="aa-main-content">{children}</div>
      </div>

      <MobileNavigation currentPath={currentPath} />
    </div>
  );
}
