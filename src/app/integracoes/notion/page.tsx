import Link from "next/link";

import { NotionConnectionPanel } from "@/components/integrations/NotionConnectionPanel";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

export default async function NotionIntegrationPage() {
  await requireAuthenticatedUser();

  return (
    <AuthenticatedShell currentPath="/configuracoes">
      <ArcanaPage
        eyebrow="Integração · Conhecimento"
        title="Notion"
        description="Conecte seu workspace para pesquisar e criar páginas autorizadas, mantendo o Notion como camada de conhecimento e documentação da Academia Arcana."
      >
        <NotionConnectionPanel />
        <nav
          aria-label="Navegação da integração Notion"
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
