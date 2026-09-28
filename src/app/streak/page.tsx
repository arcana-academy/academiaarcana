import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeaturePage } from "@/components/layout/FeaturePage";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

const items = [
  { title: "Sequência", description: "Estrutura preparada para exibir continuidade baseada em registros reais." },
  { title: "Marcos de consistência", description: "Base para reconhecer hábitos sem fabricar progresso." },
] as const;

export default async function StreakPage() {
  await requireAuthenticatedUser();

  return (
    <AuthenticatedShell currentPath="/streak">
      <FeaturePage
        eyebrow="Consistência"
        title="Streak"
        description="Visualize a continuidade do seu estudo quando houver dados persistidos para sustentá-la."
        items={items}
      />
    </AuthenticatedShell>
  );
}
