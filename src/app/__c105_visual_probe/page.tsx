import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { Sanctuary } from "@/components/sanctuary/Sanctuary";
import type { SanctuaryViewModel } from "@/domains/sanctuary";

// C105: A disposable, synthetic visual fixture. NEVER port this route to main.
// No session, no database, no real student, no bypass of /santuario protections.
const demo: SanctuaryViewModel = {
  header: { greeting: "Seu Santuário de aprendizagem", user: { id: "synthetic-c105", displayName: "Estudante de teste" } },
  primaryAction: { id: "open-workspace", label: "Abrir Workspace", href: "/workspace?view=tree#current", priority: "primary" },
  continueLearning: { status: "empty", data: null },
  progress: { status: "not-configured", data: null },
  missions: { status: "not-configured", data: null },
  schedule: { status: "not-configured", data: null },
  adaptiveRecommendation: {
    title: "Explore no seu ritmo",
    message: "Escolha um conteúdo e avance no seu ritmo.",
    reason: "Não há sinais suficientes para uma recomendação mais específica.",
    href: "/grimorios"
  },
  quickActions: []
};

export default function C105SyntheticSanctuary() {
  return <AuthenticatedShell currentPath="/santuario"><Sanctuary viewModel={demo} /></AuthenticatedShell>;
}
