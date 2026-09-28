import { Menu } from "lucide-react";

import { AuthenticatedNavigation } from "@/components/navigation/AuthenticatedNavigation";
import type { AuthenticatedRouteHref } from "@/config/navigation";

type MobileNavigationProps = {
  currentPath: AuthenticatedRouteHref;
};

export function MobileNavigation({ currentPath }: MobileNavigationProps) {
  return (
    <details className="aa-mobile-navigation">
      <summary>
        <Menu size={18} aria-hidden="true" />
        Navegação
      </summary>
      <div className="aa-mobile-navigation-panel">
        <AuthenticatedNavigation currentPath={currentPath} />
      </div>
    </details>
  );
}
