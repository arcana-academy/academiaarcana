import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  House,
  Library,
  SlidersHorizontal,
} from "lucide-react";

export type AuthenticatedRouteHref =
  | "/academia"
  | "/grimorios"
  | "/santuario"
  | "/workspace"
  | "/cronograma"
  | "/personalizar";

type AuthenticatedNavigationItem = {
  href: AuthenticatedRouteHref;
  label: string;
  icon: typeof House;
};

type AuthenticatedNavigationProps = {
  currentPath: AuthenticatedRouteHref;
  mobile?: boolean;
};

const navigationItems: ReadonlyArray<AuthenticatedNavigationItem> = [
  { href: "/santuario", label: "Santuário", icon: House },
  { href: "/academia", label: "Academia", icon: GraduationCap },
  { href: "/grimorios", label: "Grimórios", icon: Library },
  { href: "/workspace", label: "Workspace", icon: BookOpen },
  { href: "/cronograma", label: "Cronograma", icon: CalendarDays },
  { href: "/personalizar", label: "Personalizar", icon: SlidersHorizontal },
];

export function AuthenticatedNavigation({
  currentPath,
  mobile = false,
}: AuthenticatedNavigationProps) {
  return (
    <nav
      className={mobile ? "aa-navigation aa-navigation-mobile" : "aa-navigation"}
      aria-label={mobile ? "Navegação móvel" : "Seções da Academia"}
    >
      <ul className="aa-navigation-list">
        {navigationItems.map((item) => {
          const isCurrent = item.href === currentPath;
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                className={["aa-nav-link", isCurrent ? "aa-nav-link-current" : ""]
                  .filter(Boolean)
                  .join(" ")}
                href={item.href}
                aria-current={isCurrent ? "page" : undefined}
              >
                <Icon aria-hidden="true" size={mobile ? 20 : 19} strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
