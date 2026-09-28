import type { ReactNode } from "react";

import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { Sidebar } from "@/components/layout/Sidebar";
import type { AuthenticatedRouteHref } from "@/components/navigation/navigation-items";

type AppShellProps = {
  currentPath: AuthenticatedRouteHref;
  children: ReactNode;
  headerActions?: ReactNode;
};

export function AppShell({
  currentPath,
  children,
  headerActions,
}: AppShellProps) {
  return (
    <div className="aa-app-frame">
      <Sidebar currentPath={currentPath} />

      <div className="aa-app-column">
        <header className="aa-mobile-topbar">
          <div className="aa-sidebar-heading">
            <span className="aa-brand-mark" aria-hidden="true">✦</span>
            <div>
              <p className="aa-app-brand">Academia Arcana</p>
              <p className="aa-app-context">Jornada de aprendizagem</p>
            </div>
          </div>
          {headerActions ? (
            <div className="aa-mobile-topbar-actions">{headerActions}</div>
          ) : null}
        </header>

        <div className="aa-app-main">{children}</div>
      </div>

      <MobileNavigation currentPath={currentPath} />
    </div>
  );
}
