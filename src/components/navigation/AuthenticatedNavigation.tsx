import Link from "next/link";

type AuthenticatedNavigationProps = {
  currentPath: "/santuario" | "/workspace";
};

const navigationItems = [
  { href: "/santuario" as const, label: "Santuário" },
  { href: "/workspace" as const, label: "Workspace" },
];

export function AuthenticatedNavigation({
  currentPath,
}: AuthenticatedNavigationProps) {
  return (
    <nav
      className="aa-card aa-card-default"
      aria-label="Navegação principal"
    >
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

          return (
            <li key={item.href}>
              <Link
                className={`aa-button ${isCurrent ? "aa-button-primary" : "aa-button-secondary"} aa-button-sm`}
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
