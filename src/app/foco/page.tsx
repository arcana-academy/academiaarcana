import { Brain, Clock3, Focus } from "lucide-react";
import Link from "next/link";

import { startFocusSession, completeFocusSession } from "./actions";
import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeatureCard } from "@/components/ui/feature-card";
import { FocusSession } from "@/components/foco/FocusSession";

export default function FocoPage() {
  return (
    <AuthenticatedShell currentPath="/foco">
      <ArcanaPage
        eyebrow="Produtividade"
        title="Foco"
        description="Um espaço para reduzir distrações e apoiar sessões de estudo previsíveis e confortáveis."
        actions={[{ href: "/cronograma", label: "Planejar sessão", variant: "primary" }]}
      >
        <FocusSession
          onStart={startFocusSession}
          onComplete={completeFocusSession}
        />

        <ArcanaFeatureGrid>
          <FeatureCard title="Sessão registrada" description="Inícios e conclusões podem alimentar métricas reais da sua jornada." icon={<Focus size={22} />}>
            <p className="aa-state-copy">Uma sessão só é contabilizada como concluída quando o temporizador chega ao fim.</p>
          </FeatureCard>
          <FeatureCard title="Ritmo" description="Estruture blocos de trabalho e pausas de acordo com sua preferência." icon={<Clock3 size={22} />}>
            <Link className="aa-button aa-button-secondary aa-button-sm" href="/cronograma">Ver cronograma</Link>
          </FeatureCard>
          <FeatureCard title="Conforto cognitivo" description="Preferências de acessibilidade devem acompanhar a experiência." icon={<Brain size={22} />}>
            <Link className="aa-button aa-button-secondary aa-button-sm" href="/personalizar">Personalizar experiência</Link>
          </FeatureCard>
        </ArcanaFeatureGrid>
      </ArcanaPage>
    </AuthenticatedShell>
  );
}
