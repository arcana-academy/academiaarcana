import Link from "next/link";

import { TodoistConnectionPanel } from "@/components/integrations/TodoistConnectionPanel";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

export default async function TodoistIntegrationPage() {
  await requireAuthenticatedUser();

  return (
    <AuthenticatedShell currentPath="/configuracoes">
      <ArcanaPage
        eyebrow="Integração · Planejamento"
        title="Todoist"
        description="Conecte sua conta para levar tarefas de estudo, prazos e organização do cronograma para o Todoist sem expor credenciais ao navegador."
      >
        <TodoistConnectionPanel />
        <nav
          aria-label="Navegação da integração Todoist"
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
