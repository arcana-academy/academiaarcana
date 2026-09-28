import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CalendarDays,
  Home,
  Library,
  Palette,
  PanelLeft,
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

export const navigationItems: readonly NavigationItem[] = [
  {
    href: "/santuario",
    label: "Santuário",
    description: "Seu ponto de partida",
    icon: Home,
  },
  {
    href: "/academia",
    label: "Academia",
    description: "Áreas de estudo",
    icon: BookOpen,
  },
  {
    href: "/grimorios",
    label: "Grimórios",
    description: "Sua biblioteca",
    icon: Library,
  },
  {
    href: "/workspace",
    label: "Workspace",
    description: "Organizar estudos",
    icon: PanelLeft,
  },
  {
    href: "/cronograma",
    label: "Cronograma",
    description: "Planejar tarefas",
    icon: CalendarDays,
  },
  {
    href: "/personalizar",
    label: "Personalizar",
    description: "Ajustar sua experiência",
    icon: Palette,
  },
];
