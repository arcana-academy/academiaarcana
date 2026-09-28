import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  Home,
  NotebookTabs,
  Palette,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  id: string;
  label: string;
  href: "/santuario" | "/academia" | "/grimorios" | "/workspace" | "/cronograma" | "/personalizar";
  icon: LucideIcon;
  description: string;
};

export const primaryNavigation: readonly NavigationItem[] = [
  { id: "santuario", label: "Santuário", href: "/santuario", icon: Home, description: "Seu ponto de partida" },
  { id: "academia", label: "Academia", href: "/academia", icon: GraduationCap, description: "Aprender e avançar" },
  { id: "grimorios", label: "Grimórios", href: "/grimorios", icon: BookOpen, description: "Conhecimento organizado" },
  { id: "workspace", label: "Workspace", href: "/workspace", icon: NotebookTabs, description: "Seu espaço de estudo" },
  { id: "cronograma", label: "Cronograma", href: "/cronograma", icon: CalendarDays, description: "Planejar a jornada" },
  { id: "personalizar", label: "Personalizar", href: "/personalizar", icon: Palette, description: "Ajustar sua experiência" },
];
