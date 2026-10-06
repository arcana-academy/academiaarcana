import Link from "next/link";
import { Menu } from "lucide-react";
import { navigationItems } from "@/components/navigation/AuthenticatedNavigation";

type MobileNavigationProps = {
  currentPath: string;
};

export function MobileNavigation({ currentPath }: MobileNavigationProps) {
  return (
    <details className="aa-mobile-navigation">
      <summary className="aa-mobile-navigation-trigger">
        <Menu size={21} aria-hidden="true" />
        <span>Navegar</span>
      </summary>
      <nav className="aa-mobile-navigation-panel" aria-label="Navegação móvel">
        <ul className="aa-mobile-navigation-scroll">
          {navigationItems.map((item) => {
            const active = item.href === currentPath;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`aa-mobile-link ${active ? "aa-mobile-link-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </details>
  );
}
