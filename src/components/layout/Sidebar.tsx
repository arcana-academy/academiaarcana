import Link from "next/link";
import type { AuthenticatedRouteHref } from "@/config/navigation";
import { navigationItems } from "@/config/navigation";

type SidebarProps = {
  currentPath: AuthenticatedRouteHref;
};

export function Sidebar({ currentPath }: SidebarProps) {
  return (
    <aside className="aa-sidebar" aria-label="Barra lateral">
      <div className="aa-sidebar-brand">
        <span className="aa-brand-mark" aria-hidden="true">✦</span>
        <div>
          <span className="aa-brand-kicker">Academia</span>
          <span className="aa-brand-name">Arcana</span>
        </div>
      </div>

      <div className="aa-sidebar-intro">
        <span className="aa-sidebar-eyebrow">Seu santuário de estudo</span>
        <p>Aprenda, organize e avance no seu próprio ritmo.</p>
      </div>

      <nav aria-label="Navegação principal">
        <ul className="aa-sidebar-nav">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === currentPath;

            return (
              <li key={item.href}>
                <Link
                  className={active ? "aa-sidebar-link aa-sidebar-link-active" : "aa-sidebar-link"}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="aa-sidebar-icon" aria-hidden="true">
                    <Icon size={18} strokeWidth={1.8} />
                  </span>
                  <span className="aa-sidebar-link-copy">
                    <strong>{item.label}</strong>
                    <span aria-hidden="true">{item.description}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="aa-sidebar-ritual" aria-label="Princípio da Academia Arcana">
        <span className="aa-sidebar-ritual-mark" aria-hidden="true">◇</span>
        <p>Cada pequeno passo constrói sua jornada.</p>
      </div>
    </aside>
  );
}
