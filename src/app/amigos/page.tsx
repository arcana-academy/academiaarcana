import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeaturePage } from "@/components/layout/FeaturePage";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

const items = [
  { title: "Amigos", description: "Estrutura para relações sociais e descoberta de colegas de estudo." },
  { title: "Compartilhamento", description: "Base para futuras experiências sociais sob regras explícitas de autorização." },
] as const;

export default async function AmigosPage() {
  await requireAuthenticatedUser();

  return (
    <AuthenticatedShell currentPath="/amigos">
      <FeaturePage
        eyebrow="Social"
        title="Amigos"
        description="Um espaço social que mantém privacidade e autorização como requisitos estruturais."
        items={items}
      />
    </AuthenticatedShell>
  );
}
