import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeaturePage } from "@/components/layout/FeaturePage";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

const items = [
  { title: "Sessão de foco", description: "Estrutura visual para iniciar, acompanhar e concluir uma sessão." },
  { title: "Ritmo de estudo", description: "Base preparada para sinais reais de tempo e consistência." },
] as const;

export default async function FocoPage() {
  await requireAuthenticatedUser();

  return (
    <AuthenticatedShell currentPath="/foco">
      <FeaturePage
        eyebrow="Produtividade"
        title="Foco"
        description="Concentre a jornada atual em uma tarefa, sem perder o contexto do estudo."
        items={items}
      />
    </AuthenticatedShell>
  );
}
