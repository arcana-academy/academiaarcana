"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { primaryNavigation, type NavigationItem } from "@/config/navigation";

type MobileNavigationProps = {
  currentPath: NavigationItem["href"];
};

export function MobileNavigation({ currentPath }: MobileNavigationProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="aa-mobile-navigation">
      <button
        className="aa-mobile-navigation-trigger"
        type="button"
        aria-expanded={open}
        aria-controls="aa-mobile-menu"
        aria-label={open ? "Fechar navegação" : "Abrir navegação"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        <span>{open ? "Fechar" : "Navegar"}</span>
      </button>

      {open ? (
        <nav id="aa-mobile-menu" className="aa-mobile-menu" aria-label="Navegação móvel">
          <ul>
            {primaryNavigation.map((item) => {
              const Icon = item.icon;
              const active = item.href === currentPath;

              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={["aa-mobile-link", active && "is-active"].filter(Boolean).join(" ")}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
