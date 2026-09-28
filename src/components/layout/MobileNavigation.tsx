"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { navigationItems, type AuthenticatedRouteHref } from "@/config/navigation";

type MobileNavigationProps = {
  currentPath: AuthenticatedRouteHref;
};

export function MobileNavigation({ currentPath }: MobileNavigationProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="aa-mobile-nav">
      <button
        type="button"
        className="aa-button aa-button-secondary aa-icon-button"
        aria-label={open ? "Fechar navegação" : "Abrir navegação"}
        aria-expanded={open}
        aria-controls="aa-mobile-navigation"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
      </button>

      {open ? (
        <nav id="aa-mobile-navigation" className="aa-mobile-menu" aria-label="Navegação principal">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === currentPath;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "aa-mobile-link aa-mobile-link-active" : "aa-mobile-link"}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
