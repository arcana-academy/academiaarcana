import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { primaryNavigation, type NavigationItem } from "@/config/navigation";

type SidebarProps = {
  currentPath: NavigationItem["href"];
};

export function Sidebar({ currentPath }: SidebarProps) {
  return (
    <aside className="aa-sidebar" aria-label="Barra lateral">
      <div className="aa-sidebar-intro">
        <span className="aa-sidebar-kicker">Núcleo de estudo</span>
        <p className="aa-sidebar-title">Sua jornada, em um só lugar.</p>
      </div>

      <nav aria-label="Navegação principal">
        <ul className="aa-sidebar-list">
          {primaryNavigation.map((item) => {
            const Icon = item.icon;
            const active = item.href === currentPath;

            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={["aa-sidebar-link", active && "is-active"].filter(Boolean).join(" ")}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="aa-sidebar-icon" aria-hidden="true">
                    <Icon size={18} strokeWidth={1.8} />
                  </span>
                  <span className="aa-sidebar-copy">
                    <span className="aa-sidebar-label">{item.label}</span>
                    <span className="aa-sidebar-description" aria-hidden="true">{item.description}</span>
                  </span>
                  <ChevronRight className="aa-sidebar-chevron" size={16} aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="aa-sidebar-footer">
        <span className="aa-sidebar-footer-mark" aria-hidden="true">✦</span>
        <p>Conhecimento se constrói passo a passo.</p>
      </div>
    </aside>
  );
}
