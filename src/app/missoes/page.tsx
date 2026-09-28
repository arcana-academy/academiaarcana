import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeaturePage } from "@/components/layout/FeaturePage";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

const items = [
  { title: "Missões diárias", description: "Estrutura visual para tarefas recorrentes e objetivos de estudo." },
  { title: "Recompensas", description: "Espaço reservado para progressão baseada em dados reais de gamificação." },
] as const;

export default async function MissoesPage() {
  await requireAuthenticatedUser();

  return (
    <AuthenticatedShell currentPath="/missoes">
      <FeaturePage
        eyebrow="Gamificação"
        title="Missões"
        description="Um espaço para transformar objetivos de estudo em desafios claros e acompanháveis."
        items={items}
      />
    </AuthenticatedShell>
  );
}
