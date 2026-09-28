import Link from "next/link";

import {
  navigationItems,
  type AuthenticatedRouteHref,
} from "./navigation-items";

export type { AuthenticatedRouteHref };

type AuthenticatedNavigationProps = {
  currentPath: AuthenticatedRouteHref;
};

export function AuthenticatedNavigation({
  currentPath,
}: AuthenticatedNavigationProps) {
  return (
    <nav className="aa-card aa-card-default" aria-label="Navegação principal">
      <ul className="aa-navigation-list">
        {navigationItems.map((item) => {
          const isCurrent = item.href === currentPath;

          return (
            <li key={item.href}>
              <Link
                className={[
                  "aa-button",
                  isCurrent ? "aa-button-primary" : "aa-button-secondary",
                  "aa-button-sm",
                  isCurrent ? "aa-nav-link-active" : "",
                ].filter(Boolean).join(" ")}
                href={item.href}
                aria-current={isCurrent ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
