import type { Metadata } from "next";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { PortalShellPreview } from "@/components/portals/PortalShellPreview";
import { PORTAL_PREVIEW_IDS } from "@/design-system/portal-previews/catalog";

export const metadata: Metadata = {
  title: "Portais propostos | Academia Arcana",
  description: "Estruturas demonstrativas de Professor, Tutor, Mentor e Consultoria.",
  robots: { index: false, follow: false },
};

export default async function PortalPreviewsPage() {
  await requireAuthenticatedUser();
  return (
    <main style={{ maxWidth: "80rem", margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Portais — estruturas de interface propostas</h1>
      <p>
        Prévia autenticada, sem dados acadêmicos ou permissões adicionais.
        A criação de rotas reais depende de contratos canônicos de autorização.
      </p>
      {PORTAL_PREVIEW_IDS.map((id) => <PortalShellPreview key={id} id={id} />)}
    </main>
  );
}
