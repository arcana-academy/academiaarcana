import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { Award, Crown, Gem } from "lucide-react";
import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeatureCard } from "@/components/ui/feature-card";

export default async function ConquistasPage() {
  await requireAuthenticatedUser();
  return (
    <AuthenticatedShell currentPath="/conquistas">
      <ArcanaPage
        eyebrow="Reconhecimento"
        title="Conquistas"
        description="Celebre marcos reais da sua jornada sem transformar aprendizagem em competição obrigatória."
      >
        <ArcanaFeatureGrid>
          <FeatureCard title="Conquistas" description="Coleção de marcos obtidos a partir de eventos reais." icon={<Award size={22} />}>
            <p className="aa-state-copy">Nenhuma conquista persistida está disponível.</p>
          </FeatureCard>
          <FeatureCard title="Títulos" description="Títulos são consequência de progresso verificável." icon={<Crown size={22} />}>
            <p className="aa-state-copy">O catálogo visual está preparado para receber regras reais de gamificação.</p>
          </FeatureCard>
          <FeatureCard title="Marcos" description="Pequenos avanços também podem ser reconhecidos." icon={<Gem size={22} />}>
            <p className="aa-state-copy">Não há marcos fictícios sendo exibidos para preencher a interface.</p>
          </FeatureCard>
        </ArcanaFeatureGrid>
      </ArcanaPage>
    </AuthenticatedShell>
  );
}
