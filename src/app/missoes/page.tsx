import { Flag, Sparkles, Target } from "lucide-react";
import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeatureCard } from "@/components/ui/feature-card";

export default function MissoesPage() {
  return (
    <AuthenticatedShell currentPath="/missoes">
      <ArcanaPage
        eyebrow="Gamificação"
        title="Missões"
        description="Transforme objetivos de aprendizagem em passos claros, sem pressão artificial ou punição."
        actions={[{ href: "/cronograma", label: "Abrir cronograma", variant: "secondary" }]}
      >
        <ArcanaFeatureGrid>
          <FeatureCard
            title="Missões conscientes"
            description="A estrutura visual está pronta para receber missões reais do domínio de gamificação."
            icon={<Flag size={22} />}
          >
            <p className="aa-state-copy">Nenhuma missão persistida está disponível para exibição neste momento.</p>
          </FeatureCard>
          <FeatureCard
            title="Objetivos"
            description="Conecte metas de estudo a ações observáveis e significativas."
            icon={<Target size={22} />}
          >
            <p className="aa-state-copy">Os contratos de domínio podem alimentar esta área sem criar dados fictícios.</p>
          </FeatureCard>
          <FeatureCard
            title="Progresso significativo"
            description="Reconhecimento de avanço, nunca vergonha, culpa ou fracasso artificial."
            icon={<Sparkles size={22} />}
          >
            <p className="aa-state-copy">A camada de apresentação está preparada para estados vazios, disponíveis e indisponíveis.</p>
          </FeatureCard>
        </ArcanaFeatureGrid>
      </ArcanaPage>
    </AuthenticatedShell>
  );
}
