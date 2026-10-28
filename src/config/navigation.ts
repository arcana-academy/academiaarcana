import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Brain,
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
  | "/pratica"
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

export type NavigationSection = "Início" | "Meus estudos" | "Planejamento" | "Progresso" | "Conta e comunidade";

export type NavigationItem = {
  href: AuthenticatedRouteHref;
  section: NavigationSection;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const navigationItems: ReadonlyArray<NavigationItem> = [
  {
    href: "/santuario",
    section: "Início",
    label: "Santuário",
    description: "Sua página inicial",
    icon: LayoutDashboard,
  },
  {
    href: "/academia",
    section: "Início",
    label: "Academia",
    description: "Atividades de aprendizagem",
    icon: GraduationCap,
  },
  {
    href: "/grimorios",
    section: "Meus estudos",
    label: "Grimórios",
    description: "Biblioteca de estudos",
    icon: Library,
  },
  {
    href: "/workspace",
    section: "Meus estudos",
    label: "Editor de estudos",
    description: "Escreva e organize páginas",
    icon: BookOpen,
  },
  {
    href: "/cronograma",
    section: "Planejamento",
    label: "Cronograma",
    description: "Planejamento",
    icon: CalendarDays,
  },
  {
    href: "/pratica",
    section: "Meus estudos",
    label: "Prática",
    description: "Recuperação e revisão",
    icon: Brain,
  },
  {
    href: "/missoes",
    section: "Planejamento",
    label: "Missões",
    description: "Objetivos de estudo",
    icon: Target,
  },
  {
    href: "/foco",
    section: "Planejamento",
    label: "Foco",
    description: "Sessões de concentração",
    icon: Target,
  },
  {
    href: "/streak",
    section: "Progresso",
    label: "Sequência de estudos",
    description: "Regularidade sem cobrança",
    icon: Flame,
  },
  {
    href: "/estatisticas",
    section: "Progresso",
    label: "Estatísticas",
    description: "Seu progresso",
    icon: BarChart3,
  },
  {
    href: "/conquistas",
    section: "Progresso",
    label: "Conquistas",
    description: "Marcos alcançados",
    icon: Trophy,
  },
  {
    href: "/amigos",
    section: "Conta e comunidade",
    label: "Amigos",
    description: "Conexões de estudo",
    icon: Users,
  },
  {
    href: "/perfil",
    section: "Conta e comunidade",
    label: "Perfil",
    description: "Sua identidade",
    icon: UserCircle,
  },
  {
    href: "/personalizar",
    section: "Conta e comunidade",
    label: "Personalizar",
    description: "Seu ambiente",
    icon: Sparkles,
  },
  {
    href: "/configuracoes",
    section: "Conta e comunidade",
    label: "Configurações",
    description: "Preferências da conta",
    icon: Settings,
  },
];

/** Sections appear in the same order on desktop and mobile without hiding destinations. */
export const navigationGroups: ReadonlyArray<{ label: NavigationSection; items: ReadonlyArray<NavigationItem> }> =
  (["Início", "Meus estudos", "Planejamento", "Progresso", "Conta e comunidade"] as const).map((label) => ({
    label,
    items: navigationItems.filter((item) => item.section === label),
  }));
