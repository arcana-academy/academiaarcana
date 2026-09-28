import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  House,
  Palette,
} from "lucide-react";

export const authenticatedNavigation = [
  {
    href: "/academia",
    label: "Academia",
    description: "Visão das áreas de aprendizagem disponíveis.",
    icon: GraduationCap,
  },
  {
    href: "/santuario",
    label: "Santuário",
    description: "Seu contexto atual e o próximo passo da jornada.",
    icon: House,
  },
  {
    href: "/workspace",
    label: "Workspace",
    description: "Organize grimórios, cadernos, capítulos e páginas.",
    icon: BookOpen,
  },
  {
    href: "/cronograma",
    label: "Cronograma",
    description: "Planeje e acompanhe suas tarefas de estudo.",
    icon: CalendarDays,
  },
  {
    href: "/personalizar",
    label: "Personalizar",
    description: "Ajuste tema visual e preferências de movimento.",
    icon: Palette,
  },
] as const satisfies readonly {
  href: `/${string}`;
  label: string;
  description: string;
  icon: LucideIcon;
}[];

export type AuthenticatedRouteHref =
  (typeof authenticatedNavigation)[number]["href"];
