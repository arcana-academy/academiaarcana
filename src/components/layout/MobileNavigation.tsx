import Link from "next/link";
import { navigationItems } from "@/components/navigation/AuthenticatedNavigation";

type MobileNavigationProps = {
  currentPath: string;
};

export function MobileNavigation({ currentPath }: MobileNavigationProps) {
  return (
    <nav className="aa-mobile-navigation" aria-label="Navegação móvel">
      <div className="aa-mobile-navigation-scroll">
        {navigationItems.map((item) => {
          const active = item.href === currentPath;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`aa-mobile-link ${active ? "aa-mobile-link-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
