import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeaturePage } from "@/components/layout/FeaturePage";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

const items = [
  { title: "Identidade", description: "Estrutura para apresentar o perfil autenticado sem expor dados desnecessários." },
  { title: "Preferências", description: "Base para centralizar escolhas pessoais que não pertencem ao domínio de identidade." },
] as const;

export default async function PerfilPage() {
  await requireAuthenticatedUser();

  return (
    <AuthenticatedShell currentPath="/perfil">
      <FeaturePage
        eyebrow="Conta"
        title="Perfil"
        description="Gerencie a apresentação da sua identidade e as preferências associadas à experiência."
        items={items}
      />
    </AuthenticatedShell>
  );
}
