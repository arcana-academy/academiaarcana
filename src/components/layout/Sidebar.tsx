import Image from "next/image";
import Link from "next/link";
import { navigationItems, type AuthenticatedRouteHref } from "@/components/navigation/AuthenticatedNavigation";

type SidebarProps = {
  currentPath: string;
};

export function Sidebar({ currentPath }: SidebarProps) {
  return (
    <div className="aa-sidebar">
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
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href as AuthenticatedRouteHref}
                  className={`aa-sidebar-link ${active ? "aa-sidebar-link-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="aa-sidebar-icon" aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
