import { notFound } from "next/navigation";
import { ConfiguracoesContent } from "@/app/configuracoes/page";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { Sanctuary } from "@/components/sanctuary/Sanctuary";
import type { SanctuaryViewModel } from "@/domains/sanctuary";

/** Isolated C106 review fixture ONLY, never part of the protected product branch. */
const synthetic: SanctuaryViewModel = {
  header: { greeting: "Seu Santuário de aprendizagem", user: { id: "synthetic-c106", displayName: "Estudante" } },
  primaryAction: { id: "open-workspace", label: "Abrir Workspace", href: "/workspace?view=tree#current", priority: "supporting" },
  continueLearning: { status: "empty", data: null },
  progress: { status: "not-configured", data: null },
  missions: { status: "not-configured", data: null },
  schedule: { status: "not-configured", data: null },
  quickActions: [],
  adaptiveRecommendation: {
    title: "Explore no seu ritmo",
    message: "Escolha um conteúdo e avance no seu ritmo.",
    reason: "Esta prévia utiliza somente informações fictícias.",
    href: "/grimorios",
  },
};
export default async function C106VisualFixture({ params }: { params: Promise<{ surface: string }> }) {
  const { surface } = await params;
  if (surface === "configuracoes") {
    return <AuthenticatedShell currentPath="/configuracoes"><ConfiguracoesContent /></AuthenticatedShell>;
  }
  if (surface === "santuario") {
    return <AuthenticatedShell currentPath="/santuario"><Sanctuary viewModel={synthetic} /></AuthenticatedShell>;
  }
  notFound();
}
