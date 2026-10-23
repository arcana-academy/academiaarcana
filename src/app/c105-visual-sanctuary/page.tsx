import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { Sanctuary } from "@/components/sanctuary/Sanctuary";
import type { SanctuaryViewModel } from "@/domains/sanctuary";

/** C105 diagnostic only. Synthetic fixture; must never be merged or shipped. */
const viewModel: SanctuaryViewModel = {
  header: { greeting: "Seu Santuário de aprendizagem", user: { id: "c105-synthetic-only", displayName: "Estudante de demonstração" } },
  primaryAction: { id: "open-workspace", label: "Explorar conteúdo", href: "/workspace?view=tree#current", priority: "supporting" },
  continueLearning: { status: "empty", data: null },
  progress: { status: "not-configured", data: null },
  missions: { status: "not-configured", data: null },
  schedule: { status: "not-configured", data: null },
  quickActions: [],
  adaptiveRecommendation: { title: "Explore no seu ritmo", message: "Escolha um conteúdo e avance no seu ritmo.", reason: "Não há sinais suficientes para uma recomendação mais específica.", href: "/grimorios" }
};

export default function C105SyntheticSanctuary() {
  return <AuthenticatedShell currentPath="/santuario">
    <p role="status" data-testid="c105-synthetic" style={{ padding: "0.7rem 1rem", background: "#30233A", color: "#F0DAB8", margin: 0 }}>C105 · Prévia sintética, sem dados reais de estudantes</p>
    <Sanctuary viewModel={viewModel} />
  </AuthenticatedShell>;
}
