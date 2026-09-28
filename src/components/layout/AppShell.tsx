import type { ReactNode } from "react";

import { MobileNavigation } from "./MobileNavigation";
import { PageHeader } from "./PageHeader";
import { Sidebar } from "./Sidebar";
import type { AuthenticatedRouteHref } from "@/config/navigation";

type AppShellProps = {
  currentPath: AuthenticatedRouteHref;
  children: ReactNode;
};

export function AppShell({ currentPath, children }: AppShellProps) {
  return (
    <div className="aa-app-shell">
      <a className="aa-skip-link" href="#main-content">
        Pular para o conteúdo principal
      </a>

      <PageHeader />

      <div className="aa-app-body">
        <Sidebar currentPath={currentPath} />

        <div className="aa-app-content">
          <MobileNavigation currentPath={currentPath} />
          <div id="main-content" className="aa-main-content" tabIndex={-1}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
