import { Brain, Clock3, Focus } from "lucide-react";
import Link from "next/link";
import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeatureCard } from "@/components/ui/feature-card";
import { FocusSession } from "@/components/foco/FocusSession";
import { completeFocusSession, startFocusSession } from "./actions";

export default function FocoPage() {
  return (
    <AuthenticatedShell currentPath="/foco">
      <ArcanaPage
        eyebrow="Produtividade"
        title="Foco"
        description="Um espaço para reduzir distrações e apoiar sessões de estudo previsíveis e confortáveis."
        actions={[{ href: "/cronograma", label: "Planejar sessão", variant: "primary" }]}
      >
        <FocusSession startSession={startFocusSession} completeSession={completeFocusSession} />

      <ArcanaFeatureGrid>
          <FeatureCard title="Sessão de foco" description="Base visual para uma experiência de foco sem sobrecarga." icon={<Focus size={22} />}>
            <p className="aa-state-copy">O temporizador persistente ainda não está configurado. A interface não simula uma sessão inexistente.</p>
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
