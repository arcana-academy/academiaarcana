import { AuthenticatedNavigation } from "@/components/navigation/AuthenticatedNavigation";
import type { AuthenticatedRouteHref } from "@/config/navigation";

type SidebarProps = {
  currentPath: AuthenticatedRouteHref;
};

export function Sidebar({ currentPath }: SidebarProps) {
  return (
    <aside className="aa-sidebar" aria-label="Navegação da área autenticada">
      <div className="aa-sidebar-heading">
        <p className="aa-eyebrow">Explorar</p>
        <p className="aa-sidebar-hint">Escolha onde continuar.</p>
      </div>
      <AuthenticatedNavigation currentPath={currentPath} />
    </aside>
  );
}
