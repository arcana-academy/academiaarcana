import Link from "next/link";

export type AuthenticatedRouteHref =
  | "/santuario"
  | "/workspace"
  | "/cronograma";

type AuthenticatedNavigationItem = {
  href: AuthenticatedRouteHref;
  label: string;
};

type AuthenticatedNavigationProps = {
  currentPath: AuthenticatedRouteHref;
};

const navigationItems: ReadonlyArray<AuthenticatedNavigationItem> = [
  { href: "/santuario", label: "Santuário" },
  { href: "/workspace", label: "Workspace" },
  { href: "/cronograma", label: "Cronograma" },
];

export function AuthenticatedNavigation({
  currentPath,
}: AuthenticatedNavigationProps) {
  return (
    <nav className="aa-card aa-card-default" aria-label="Navegação principal">
      <ul className="aa-navigation-list">
        {navigationItems.map((item) => {
          const isCurrent = item.href === currentPath;
          const variant = isCurrent
            ? "aa-button-primary"
            : "aa-button-secondary";
          const reinforcement = isCurrent ? "aa-nav-link-active" : "";

          return (
            <li key={item.href}>
              <Link
                className={["aa-button", variant, "aa-button-sm", reinforcement]
                  .filter(Boolean)
                  .join(" ")}
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
