import Image from "next/image";
import Link from "next/link";
import { navigationItems, type AuthenticatedRouteHref } from "@/components/navigation/AuthenticatedNavigation";

type SidebarProps = {
  currentPath: string;
};

/** Render primary navigation for authenticated routes. */
export function Sidebar({ currentPath }: SidebarProps) {
  return (
    <aside className="aa-sidebar" aria-label="Navegação principal">
      <div className="aa-sidebar-brand">
        <Link className="aa-brand-lockup" href="/santuario" aria-label="Academia Arcana — Santuário">
          <span className="aa-brand-mark" aria-hidden="true">
            <Image
              src="/assets/brand/aa-institutional-seal.svg"
              alt=""
              width={40}
              height={40}
              priority
            />
          </span>
          <span>
            <span className="aa-brand-kicker">Academia Arcana</span>
            <span className="aa-brand-name">Mapa Arcano</span>
          </span>
        </Link>
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
