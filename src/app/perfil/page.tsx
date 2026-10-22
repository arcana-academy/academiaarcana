import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import { BookOpen, Shield, UserRound } from "lucide-react";
import Link from "next/link";
import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeatureCard } from "@/components/ui/feature-card";

export default async function PerfilPage() {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? ("ID: " + claims.sub);
  const createdAt = data.user?.created_at
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(new Date(data.user.created_at))
    : null;

  return (
    <AuthenticatedShell currentPath="/perfil">
      <ArcanaPage
        eyebrow="Identidade"
        title="Perfil"
        description="Acompanhe sua conta, seus estudos e suas preferências."
        actions={[{ href: "/configuracoes", label: "Configurações", variant: "secondary" }]}
      >
        <ArcanaFeatureGrid>
          <FeatureCard title="Identidade" description="Consulte os dados da sua conta com segurança." icon={<UserRound size={20} />}>
            <p className="aa-state-copy">Conta: {email}</p>{createdAt ? <p className="aa-state-copy">Conta criada em {createdAt}.</p> : null}
          </FeatureCard>
          <FeatureCard title="Jornada" description="Acesse seus grimórios e continue sua jornada de estudos." icon={<BookOpen size={20} />}>
            <Link className="aa-button aa-button-secondary aa-button-sm" href="/grimorios">Abrir grimórios</Link>
          </FeatureCard>
          <FeatureCard title="Privacidade" description="Consulte suas opções de privacidade nas configurações." icon={<Shield size={20} />}>
            <Link className="aa-button aa-button-secondary aa-button-sm" href="/configuracoes">Gerenciar configurações</Link>
          </FeatureCard>
        </ArcanaFeatureGrid>
      </ArcanaPage>
    </AuthenticatedShell>
  );
}
