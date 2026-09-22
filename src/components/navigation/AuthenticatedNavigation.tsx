import Link from "next/link";

export type AuthenticatedRouteHref = "/santuario" | "/workspace";

type AuthenticatedNavigationItem = {
  href: AuthenticatedRouteHref;
  label: string;
};

type AuthenticatedNavigationProps = {
  /**
   * Route that identifies the section currently being viewed. Pages pass it as
   * a property so this component stays a Server Component without any
   * client-side route state.
   */
  currentPath: AuthenticatedRouteHref;
};

// Only sections with a real implementation are listed here. Future areas
// (Academia, Grimórios, Missões, …) join this list when their routes exist.
const navigationItems: ReadonlyArray<AuthenticatedNavigationItem> = [
  { href: "/santuario", label: "Santuário" },
  { href: "/workspace", label: "Workspace" },
];

/**
 * Shared navigation for authenticated pages.
 *
 * Pure composition: it owns no authentication, no data access and no business
 * rules. It reuses the `aa-card`/`aa-button` primitives instead of redefining
 * their geometry. The active section is conveyed semantically through
 * `aria-current="page"` and reinforced with weight and underline
 * (`aa-nav-link-active`), never by color alone. Focus visibility comes from the
 * global `:focus-visible` outline.
 */
export function AuthenticatedNavigation({
  currentPath,
}: AuthenticatedNavigationProps) {
  return (
    <nav className="aa-card aa-card-default" aria-label="Navegação principal">
      <ul
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--aa-spacing-sm)",
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}
      >
        {navigationItems.map((item) => {
          const isCurrent = item.href === currentPath;
          const variant = isCurrent
            ? "aa-button-primary"
            : "aa-button-secondary";
          const reinforcement = isCurrent ? " aa-nav-link-active" : "";

          return (
            <li key={item.href}>
              <Link
                className={`aa-button ${variant} aa-button-sm${reinforcement}`}
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
