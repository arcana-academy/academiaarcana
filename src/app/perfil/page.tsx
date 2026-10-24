import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import { BookOpen, Shield, UserRound } from "lucide-react";
import Link from "next/link";
import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeatureCard } from "@/components/ui/feature-card";
import { pageMetadata } from "@/lib/seo/site-metadata";

export const metadata = pageMetadata("/perfil");

export default async function PerfilPage() {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  let email: string | null = null;
  let createdAt: string | null = null;
  let identityLoadError = false;

  try {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user || data.user.id !== claims.sub) {
      identityLoadError = true;
    } else {
      email = data.user.email ?? null;
      createdAt = data.user.created_at
        ? new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "medium",
            timeZone: "UTC",
          }).format(new Date(data.user.created_at))
        : null;
    }
  } catch {
    identityLoadError = true;
  }

  return (
    <AuthenticatedShell currentPath="/perfil">
      <ArcanaPage
        eyebrow="Identidade"
        title="Perfil"
        description="Seu espaço de identidade e preferências, separado dos dados de aprendizagem."
        actions={[{ href: "/configuracoes", label: "Configurações", variant: "secondary" }]}
      >
        <ArcanaFeatureGrid>
          {identityLoadError ? (
            <section
              className="aa-card aa-card-elevated"
              role="alert"
              aria-labelledby="profile-identity-error-title"
            >
              <h2 id="profile-identity-error-title">Não foi possível confirmar os dados da conta</h2>
              <p className="aa-state-copy">
                Não foi possível consultar seu perfil neste momento. Nenhuma informação foi alterada.
              </p>
              <form action="/perfil" method="get">
                <button className="aa-button aa-button-primary" type="submit">
                  Tentar novamente
                </button>
              </form>
              <Link className="aa-button aa-button-secondary" href="/academia">
                Ir para a Academia
              </Link>
            </section>
          ) : (
            <FeatureCard title="Identidade" description="Informações básicas devem vir da sessão e dos dados de perfil autorizados." icon={<UserRound size={20} />}>
              <p className="aa-state-copy">Conta: {email ?? "E-mail não informado"}</p>
              {createdAt ? <p className="aa-state-copy">Conta criada em {createdAt}.</p> : null}
            </FeatureCard>
          )}
          <FeatureCard title="Jornada" description="A aprendizagem continua pertencendo ao domínio Learning." icon={<BookOpen size={20} />}>
            <Link className="aa-button aa-button-secondary aa-button-sm" href="/grimorios">Abrir grimórios</Link>
          </FeatureCard>
          <FeatureCard title="Privacidade" description="Preferências, consentimentos e permissões não são a mesma coisa." icon={<Shield size={20} />}>
            <Link className="aa-button aa-button-secondary aa-button-sm" href="/configuracoes">Gerenciar configurações</Link>
          </FeatureCard>
        </ArcanaFeatureGrid>
      </ArcanaPage>
    </AuthenticatedShell>
  );
}
