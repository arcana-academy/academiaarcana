import Link from "next/link";

import {
  navigationItems,
  type AuthenticatedRouteHref,
} from "@/components/navigation/navigation-items";

type MobileNavigationProps = {
  currentPath: AuthenticatedRouteHref;
};

export function MobileNavigation({ currentPath }: MobileNavigationProps) {
  return (
    <nav className="aa-mobile-navigation" aria-label="Navegação principal">
      <ul className="aa-mobile-navigation-list">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isCurrent = item.href === currentPath;

          return (
            <li key={item.href}>
              <Link
                className={[
                  "aa-mobile-navigation-link",
                  isCurrent ? "aa-mobile-navigation-link-active" : "",
                ].filter(Boolean).join(" ")}
                href={item.href}
                aria-current={isCurrent ? "page" : undefined}
              >
                <Icon aria-hidden="true" size={19} strokeWidth={1.9} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
