import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeaturePage } from "@/components/layout/FeaturePage";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

const items = [
  { title: "Acesso e segurança", description: "Estrutura para controles de sessão e segurança expostos de forma segura." },
  { title: "Experiência", description: "Base para densidade, movimento, acessibilidade e personalização da interface." },
] as const;

export default async function ConfiguracoesPage() {
  await requireAuthenticatedUser();

  return (
    <AuthenticatedShell currentPath="/configuracoes">
      <FeaturePage
        eyebrow="Sistema"
        title="Configurações"
        description="Centralize controles da conta e da experiência sem misturar responsabilidades de domínio."
        items={items}
      />
    </AuthenticatedShell>
  );
}
