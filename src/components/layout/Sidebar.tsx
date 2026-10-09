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
        <div
          className="aa-sidebar-flonts"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.65rem",
            marginTop: "1rem",
            padding: "0.5rem",
            border: "1px solid var(--aa-border-default)",
            borderRadius: "var(--aa-radius-md)",
            background: "var(--aa-surfaces-inset)",
          }}
        >
          <Image
            src="/assets/flonts/flonts-mago-mini-96.webp"
            unoptimized
            alt=""
            width={48}
            height={60}
            style={{ width: 48, height: 60, objectFit: "contain", flexShrink: 0 }}
          />
          <span style={{ fontSize: "0.875rem", lineHeight: 1.35 }}>
            Flonts está com você
          </span>
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
    </div>
  );
}
