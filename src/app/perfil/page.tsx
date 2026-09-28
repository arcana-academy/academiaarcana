import { BookOpen, Shield, UserRound } from "lucide-react";
import Link from "next/link";
import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeatureCard } from "@/components/ui/feature-card";

export default function PerfilPage() {
  return (
    <AuthenticatedShell currentPath="/perfil">
      <ArcanaPage
        eyebrow="Identidade"
        title="Perfil"
        description="Seu espaço de identidade e preferências, separado dos dados de aprendizagem."
        actions={[{ href: "/configuracoes", label: "Configurações", variant: "secondary" }]}
      >
        <ArcanaFeatureGrid>
          <FeatureCard title="Identidade" description="Informações básicas devem vir da sessão e dos dados de perfil autorizados." icon={<UserRound size={22} />}>
            <p className="aa-state-copy">O perfil detalhado será preenchido a partir das fontes de identidade existentes.</p>
          </FeatureCard>
          <FeatureCard title="Jornada" description="A aprendizagem continua pertencendo ao domínio Learning." icon={<BookOpen size={22} />}>
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
