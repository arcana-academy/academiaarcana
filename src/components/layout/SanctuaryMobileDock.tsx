import Link from "next/link";
import { CalendarDays, House, Library, Target } from "lucide-react";

const items = [
  { href: "/santuario", label: "Início", icon: House },
  { href: "/grimorios", label: "Grimórios", icon: Library },
  { href: "/missoes", label: "Missões", icon: Target },
  { href: "/cronograma", label: "Cronograma", icon: CalendarDays },
] as const;

/** C106: genuine in-app links, visible only on the approved mobile Sanctuary layout. */
export function SanctuaryMobileDock() {
  return (
    <nav className="aa-c106-mobile-dock" aria-label="Atalhos do Santuário">
      {items.map(({ href, label, icon: Icon }) => (
        <Link href={href} key={href} aria-current={href === "/santuario" ? "page" : undefined}>
          <Icon size={20} aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
