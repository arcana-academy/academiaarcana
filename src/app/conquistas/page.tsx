import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeaturePage } from "@/components/layout/FeaturePage";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

const items = [
  { title: "Conquistas", description: "Estrutura visual para marcos desbloqueados por eventos reais." },
  { title: "Coleção", description: "Base para organizar títulos, insígnias e reconhecimentos." },
] as const;

export default async function ConquistasPage() {
  await requireAuthenticatedUser();

  return (
    <AuthenticatedShell currentPath="/conquistas">
      <FeaturePage
        eyebrow="Gamificação"
        title="Conquistas"
        description="Registre e visualize marcos significativos da jornada de aprendizagem."
        items={items}
      />
    </AuthenticatedShell>
  );
}
