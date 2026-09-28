import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  House,
  Palette,
  PanelsTopLeft,
  type LucideIcon,
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

export const authenticatedNavigationItems: ReadonlyArray<NavigationItem> = [
  {
    href: "/santuario",
    label: "Santuário",
    description: "Visão geral da sua jornada de aprendizagem.",
    icon: House,
  },
  {
    href: "/academia",
    label: "Academia",
    description: "Acesso às principais áreas de estudo.",
    icon: GraduationCap,
  },
  {
    href: "/grimorios",
    label: "Grimórios",
    description: "Sua biblioteca de espaços de estudo.",
    icon: BookOpen,
  },
  {
    href: "/workspace",
    label: "Workspace",
    description: "Organize e edite seu material de estudo.",
    icon: PanelsTopLeft,
  },
  {
    href: "/cronograma",
    label: "Cronograma",
    description: "Planeje e acompanhe suas tarefas.",
    icon: CalendarDays,
  },
  {
    href: "/personalizar",
    label: "Personalizar",
    description: "Ajuste tema visual e preferências de movimento.",
    icon: Palette,
  },
];
