import Link from "next/link";

import { TrelloConnectionPanel } from "@/components/integrations/TrelloConnectionPanel";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

export default async function TrelloIntegrationPage() {
  await requireAuthenticatedUser();

  return (
    <AuthenticatedShell currentPath="/configuracoes">
      <ArcanaPage
        eyebrow="Integração · Operações"
        title="Trello"
        description="Conecte sua conta para administrar boards, listas, cards, checklists e pesquisa operacional sem expor credenciais ao navegador."
      >
        <TrelloConnectionPanel />
        <nav
          aria-label="Navegação da integração Trello"
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
