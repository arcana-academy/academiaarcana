import { BookOpen, CalendarDays, Shield, UserRound } from "lucide-react";
import Link from "next/link";

import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeatureCard } from "@/components/ui/feature-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

export default async function PerfilPage() {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user || data.user.id !== claims.sub) {
    throw new Error("Não foi possível carregar a identidade autenticada.");
  }

  return (
    <AuthenticatedShell currentPath="/perfil">
      <ArcanaPage
        eyebrow="Identidade"
        title="Perfil"
        description="Sua identidade vem da sessão autenticada; aprendizagem e preferências continuam em seus próprios domínios."
        actions={[{ href: "/configuracoes", label: "Configurações", variant: "secondary" }]}
      >
        <ArcanaFeatureGrid>
          <FeatureCard title="Identidade" description="Conta autenticada atualmente em uso." icon={<UserRound size={22} />}>
            <p className="aa-state-copy">{data.user.email ?? "E-mail não disponível"}</p>
          </FeatureCard>
          <FeatureCard title="Conta criada" description="Metadado fornecido pelo sistema de identidade." icon={<CalendarDays size={22} />}>
            <p className="aa-state-copy">{new Date(data.user.created_at).toLocaleDateString("pt-BR")}</p>
          </FeatureCard>
          <FeatureCard title="Jornada" description="A aprendizagem pertence ao domínio Learning." icon={<BookOpen size={22} />}>
            <Link className="aa-button aa-button-secondary aa-button-sm" href="/grimorios">Abrir grimórios</Link>
          </FeatureCard>
          <FeatureCard title="Privacidade" description="Preferências, consentimentos e permissões não são a mesma coisa." icon={<Shield size={22} />}>
            <Link className="aa-button aa-button-secondary aa-button-sm" href="/configuracoes">Gerenciar configurações</Link>
          </FeatureCard>
        </ArcanaFeatureGrid>
      </ArcanaPage>
    </AuthenticatedShell>
  );
}
