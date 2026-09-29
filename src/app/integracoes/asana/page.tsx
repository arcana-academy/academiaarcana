import Link from "next/link";

import { AsanaConnectionPanel } from "@/components/integrations/AsanaConnectionPanel";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

export default async function AsanaIntegrationPage() {
  await requireAuthenticatedUser();

  return (
    <AuthenticatedShell currentPath="/configuracoes">
      <ArcanaPage
        eyebrow="Integração · Planejamento"
        title="Asana"
        description="Conecte sua conta para levar tarefas de estudo e prazos para o Asana, mantendo a Academia Arcana como fonte de verdade educacional."
      >
        <AsanaConnectionPanel />
        <nav aria-label="Navegação da integração Asana" style={{ marginTop: "var(--aa-spacing-lg)" }}>
          <Link className="aa-button aa-button-secondary" href="/integracoes">
            Voltar ao hub de integrações
          </Link>
        </nav>
      </ArcanaPage>
    </AuthenticatedShell>
  );
}
