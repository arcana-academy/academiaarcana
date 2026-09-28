import { Flame, History, ShieldCheck } from "lucide-react";
import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeatureCard } from "@/components/ui/feature-card";

export default function StreakPage() {
  return (
    <AuthenticatedShell currentPath="/streak">
      <ArcanaPage
        eyebrow="Continuidade"
        title="Streak"
        description="Acompanhe consistência quando houver eventos reais de aprendizagem — sem inventar uma sequência."
      >
        <ArcanaFeatureGrid>
          <FeatureCard title="Sequência atual" description="Estado persistido da continuidade de estudo." icon={<Flame size={22} />}>
            <p className="aa-state-copy">Nenhuma sequência persistida está disponível para exibição.</p>
          </FeatureCard>
          <FeatureCard title="Histórico" description="Uma visão histórica deve ser construída a partir de eventos reais." icon={<History size={22} />}>
            <p className="aa-state-copy">A fonte de eventos ainda não está configurada nesta área.</p>
          </FeatureCard>
          <FeatureCard title="Sem punição" description="Uma pausa não deve transformar a experiência em fracasso." icon={<ShieldCheck size={22} />}>
            <p className="aa-state-copy">A regra de produto é preservar autonomia e conforto cognitivo.</p>
          </FeatureCard>
        </ArcanaFeatureGrid>
      </ArcanaPage>
    </AuthenticatedShell>
  );
}
