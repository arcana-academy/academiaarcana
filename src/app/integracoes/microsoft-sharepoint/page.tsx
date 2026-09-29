import Link from "next/link";

import { MicrosoftSharePointConnectionPanel } from "@/components/integrations/MicrosoftSharePointConnectionPanel";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

export default async function MicrosoftSharePointIntegrationPage() {
  await requireAuthenticatedUser();

  return (
    <AuthenticatedShell currentPath="/configuracoes">
      <ArcanaPage
        eyebrow="Integração · Documentos"
        title="Microsoft SharePoint"
        description="Conecte sua conta Microsoft, escolha um site e uma biblioteca e encontre documentos para usar como fontes externas dos Grimórios e do Mestre Arcano."
      >
        <MicrosoftSharePointConnectionPanel />
        <nav
          aria-label="Navegação da integração Microsoft SharePoint"
          style={{ marginTop: "var(--aa-spacing-lg)" }}
        >
          <Link className="aa-button aa-button-secondary" href="/integracoes">
            Voltar ao hub de integrações
          </Link>
        </nav>
      </ArcanaPage>
    </AuthenticatedShell>
  );
}
