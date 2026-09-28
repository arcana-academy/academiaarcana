import Link from "next/link";

import {
  authenticatedNavigationItems,
  type AuthenticatedRouteHref,
} from "@/config/navigation";

type AuthenticatedNavigationProps = {
  currentPath: AuthenticatedRouteHref;
};

export type { AuthenticatedRouteHref };

export function AuthenticatedNavigation({
  currentPath,
}: AuthenticatedNavigationProps) {
  return (
    <nav className="aa-navigation" aria-label="Navegação principal">
      <ul className="aa-navigation-list">
        {authenticatedNavigationItems.map((item) => {
          const isCurrent = item.href === currentPath;
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                className={[
                  "aa-button",
                  isCurrent ? "aa-button-primary" : "aa-button-secondary",
                  "aa-button-sm",
                  "aa-nav-link",
                  isCurrent ? "aa-nav-link-active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                href={item.href}
                aria-current={isCurrent ? "page" : undefined}
                title={item.description}
              >
                <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
