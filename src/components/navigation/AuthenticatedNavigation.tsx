import Link from "next/link";
import type { AuthenticatedRouteHref } from "@/config/navigation";
import { authenticatedNavigation } from "@/config/navigation";

type AuthenticatedNavigationProps = {
  currentPath: AuthenticatedRouteHref;
};

export function AuthenticatedNavigation({
  currentPath,
}: AuthenticatedNavigationProps) {
  return (
    <nav
      className="aa-navigation"
      aria-label="Navegação principal"
    >
      <p className="aa-nav-kicker">Navegação</p>
      <ul className="aa-navigation-list">
        {authenticatedNavigation.map((item) => {
          const isCurrent = item.href === currentPath;
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                className={[
                  "aa-nav-link",
                  isCurrent ? "aa-nav-link-current aa-nav-link-active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                href={item.href}
                aria-current={isCurrent ? "page" : undefined}
                aria-describedby={`aa-nav-description-${item.href.slice(1)}`}
              >
                <Icon aria-hidden="true" focusable="false" size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
                <span
                  className="aa-visually-hidden"
                  id={`aa-nav-description-${item.href.slice(1)}`}
                >
                  {item.description}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
