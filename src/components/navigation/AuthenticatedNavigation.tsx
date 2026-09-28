import Link from "next/link";

import { navigationItems, type AuthenticatedRouteHref } from "@/config/navigation";

type AuthenticatedNavigationProps = {
  currentPath: AuthenticatedRouteHref;
};

export function AuthenticatedNavigation({ currentPath }: AuthenticatedNavigationProps) {
  return (
    <nav className="aa-legacy-navigation" aria-label="Navegação principal">
      <ul className="aa-navigation-list">
        {navigationItems.map((item) => {
          const isCurrent = item.href === currentPath;
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                className={isCurrent ? "aa-button aa-button-primary aa-button-sm aa-nav-link-active" : "aa-button aa-button-secondary aa-button-sm"}
                href={item.href}
                aria-current={isCurrent ? "page" : undefined}
              >
                <Icon size={17} aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
