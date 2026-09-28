import Link from "next/link";

import {
  navigationItems,
  type AuthenticatedRouteHref,
} from "@/components/navigation/navigation-items";

type SidebarProps = {
  currentPath: AuthenticatedRouteHref;
};

export function Sidebar({ currentPath }: SidebarProps) {
  return (
    <aside className="aa-sidebar" aria-label="Navegação principal">
      <div className="aa-sidebar-heading">
        <span className="aa-brand-mark" aria-hidden="true">✦</span>
        <div>
          <p className="aa-app-brand">Academia Arcana</p>
          <p className="aa-app-context">Jornada de aprendizagem</p>
        </div>
      </div>

      <nav>
        <ul className="aa-sidebar-list">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isCurrent = item.href === currentPath;

            return (
              <li key={item.href}>
                <Link
                  className={[
                    "aa-sidebar-link",
                    isCurrent ? "aa-sidebar-link-active" : "",
                  ].filter(Boolean).join(" ")}
                  href={item.href}
                  aria-current={isCurrent ? "page" : undefined}
                >
                  <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
                  <span>
                    <span className="aa-sidebar-link-label">{item.label}</span>
                    <span className="aa-sidebar-link-description">
                      {item.description}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
