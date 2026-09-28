import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Flame,
  GraduationCap,
  LayoutDashboard,
  Library,
  Settings,
  Sparkles,
  Target,
  Trophy,
  UserCircle,
  Users,
} from "lucide-react";

export type AuthenticatedRouteHref =
  | "/academia"
  | "/grimorios"
  | "/santuario"
  | "/workspace"
  | "/cronograma"
  | "/missoes"
  | "/foco"
  | "/streak"
  | "/estatisticas"
  | "/conquistas"
  | "/amigos"
  | "/perfil"
  | "/personalizar"
  | "/configuracoes";

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
    href: "/missoes",
    label: "Missões",
    description: "Objetivos de estudo",
    icon: Target,
  },
  {
    href: "/foco",
    label: "Foco",
    description: "Sessões de concentração",
    icon: Target,
  },
  {
    href: "/streak",
    label: "Streak",
    description: "Continuidade de estudo",
    icon: Flame,
  },
  {
    href: "/estatisticas",
    label: "Estatísticas",
    description: "Seu progresso",
    icon: BarChart3,
  },
  {
    href: "/conquistas",
    label: "Conquistas",
    description: "Marcos alcançados",
    icon: Trophy,
  },
  {
    href: "/amigos",
    label: "Amigos",
    description: "Conexões de estudo",
    icon: Users,
  },
  {
    href: "/perfil",
    label: "Perfil",
    description: "Sua identidade",
    icon: UserCircle,
  },
  {
    href: "/personalizar",
    label: "Personalizar",
    description: "Seu ambiente",
    icon: Sparkles,
  },
  {
    href: "/configuracoes",
    label: "Configurações",
    description: "Preferências da conta",
    icon: Settings,
  },
];
