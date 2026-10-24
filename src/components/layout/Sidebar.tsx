import Image from "next/image";
import Link from "next/link";

import { FlontsPortrait } from "@/components/flonts/FlontsPortrait";
import {
  navigationItems,
  type AuthenticatedRouteHref,
} from "@/components/navigation/AuthenticatedNavigation";

type SidebarProps = {
  currentPath: string;
};

export function Sidebar({ currentPath }: SidebarProps) {
  return (
    <div className="aa-sidebar">
      <div className="aa-sidebar-brand">
        <Link
          className="aa-brand-lockup"
          href="/santuario"
          aria-label="Academia Arcana — Santuário"
        >
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
            <span className="aa-brand-kicker">Plataforma de estudos</span>
            <span className="aa-brand-name">Academia Arcana</span>
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
          <FlontsPortrait />
          <span style={{ fontSize: "0.875rem", lineHeight: 1.35 }}>
            Flonts está com você
          </span>
        </div>
      </div>

      <nav aria-label="Navegação principal">
        <ul className="aa-sidebar-nav">
          {navigationItems.map((item) => {
            const active = item.href === currentPath;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href as AuthenticatedRouteHref}
                  className={`aa-sidebar-link ${active ? "aa-sidebar-link-active" : ""}`}
                  aria-label={item.label}
                  title={item.label}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="aa-sidebar-icon" aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  <span className="aa-sidebar-link-copy">
                    <strong>{item.label}</strong>
                    <span>{item.description}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <p className="aa-sidebar-motto">
        Conhecimento também é uma forma de magia.
      </p>
    </div>
  );
}
