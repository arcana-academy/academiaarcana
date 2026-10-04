import type { ReactNode } from "react";
import { MobileNavigation } from "./MobileNavigation";
import { Sidebar } from "./Sidebar";

type AppShellProps = {
  currentPath: string;
  headerActions?: ReactNode;
  children: ReactNode;
};

export function AppShell({ currentPath, headerActions, children }: AppShellProps) {
  return (
    <div className="aa-app-shell">
      <header className="aa-app-header" aria-label="Cabeçalho da aplicação">
        <div className="aa-app-identity">
          <p className="aa-app-brand">Academia Arcana</p>
          <p className="aa-app-context">Jornada de aprendizagem</p>
        </div>
        {headerActions ? <div className="aa-app-header-actions">{headerActions}</div> : null}
      </header>

      <div className="aa-app-layout">
        <Sidebar currentPath={currentPath} />
        <div className="aa-app-main-column">
          <MobileNavigation currentPath={currentPath} />
          <main className="aa-app-content">{children}</main>
        </div>
      </div>
    </div>
  );
}
