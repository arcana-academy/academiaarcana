import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  Library,
  Sparkles,
} from "lucide-react";

export type AuthenticatedRouteHref =
  | "/academia"
  | "/grimorios"
  | "/santuario"
  | "/workspace"
  | "/cronograma"
  | "/personalizar";

export type NavigationItem = {
  href: AuthenticatedRouteHref;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const navigationItems: ReadonlyArray<NavigationItem> = [
  {
    href: "/santuario",
    label: "Santuário",
    description: "Seu centro de jornada",
    icon: LayoutDashboard,
  },
  {
    href: "/academia",
    label: "Academia",
    description: "Aprendizagem",
    icon: GraduationCap,
  },
  {
    href: "/grimorios",
    label: "Grimórios",
    description: "Biblioteca de estudos",
    icon: Library,
  },
  {
    href: "/workspace",
    label: "Workspace",
    description: "Escrita e organização",
    icon: BookOpen,
  },
  {
    href: "/cronograma",
    label: "Cronograma",
    description: "Planejamento",
    icon: CalendarDays,
  },
  {
    href: "/personalizar",
    label: "Personalizar",
    description: "Seu ambiente",
    icon: Sparkles,
  },
];
