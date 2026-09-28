import Link from "next/link";
import { navigationItems, type AuthenticatedRouteHref } from "@/components/navigation/AuthenticatedNavigation";

type SidebarProps = {
  currentPath: string;
};

export function Sidebar({ currentPath }: SidebarProps) {
  return (
    <aside className="aa-sidebar" aria-label="Navegação principal">
      <div className="aa-sidebar-heading">
        <span className="aa-sidebar-mark" aria-hidden="true">✦</span>
        <div>
          <strong>Mapa Arcano</strong>
          <span>Seções da academia</span>
        </div>
      </div>

      <nav aria-label="Navegação principal">
        <ul className="aa-sidebar-list">
          {navigationItems.map((item) => {
            const active = item.href === currentPath;
            return (
              <li key={item.href}>
                <Link
                  href={item.href as AuthenticatedRouteHref}
                  className={`aa-sidebar-link ${active ? "aa-sidebar-link-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
