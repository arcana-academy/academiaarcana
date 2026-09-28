import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeaturePage } from "@/components/layout/FeaturePage";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

const items = [
  { title: "Visão geral", description: "Estrutura para métricas de aprendizagem, planejamento e consistência." },
  { title: "Evolução", description: "Base para gráficos e comparações alimentados por dados reais." },
] as const;

export default async function EstatisticasPage() {
  await requireAuthenticatedUser();

  return (
    <AuthenticatedShell currentPath="/estatisticas">
      <FeaturePage
        eyebrow="Observação"
        title="Estatísticas"
        description="Transforme registros reais de estudo em uma visão compreensível da sua jornada."
        items={items}
      />
    </AuthenticatedShell>
  );
}
