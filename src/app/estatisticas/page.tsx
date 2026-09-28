import { BarChart3, BookOpen, TrendingUp } from "lucide-react";
import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeatureCard } from "@/components/ui/feature-card";

export default function EstatisticasPage() {
  return (
    <AuthenticatedShell currentPath="/estatisticas">
      <ArcanaPage
        eyebrow="Conhecimento sobre sua jornada"
        title="Estatísticas"
        description="Visualize padrões de aprendizagem apenas quando houver dados suficientes e autorizados para isso."
      >
        <ArcanaFeatureGrid>
          <FeatureCard title="Visão geral" description="Indicadores agregados da jornada de aprendizagem." icon={<BarChart3 size={22} />}>
            <p className="aa-state-copy">Ainda não há dados agregados suficientes para exibir métricas.</p>
          </FeatureCard>
          <FeatureCard title="Aprendizagem" description="Progresso deve vir da fonte real de Learning/Workspace." icon={<BookOpen size={22} />}>
            <p className="aa-state-copy">A área está preparada para consumir contratos existentes sem duplicar a fonte de verdade.</p>
          </FeatureCard>
          <FeatureCard title="Tendências" description="Tendências devem ser descritas com contexto e incerteza apropriados." icon={<TrendingUp size={22} />}>
            <p className="aa-state-copy">Nenhuma tendência é inferida sem evidência suficiente.</p>
          </FeatureCard>
        </ArcanaFeatureGrid>
      </ArcanaPage>
    </AuthenticatedShell>
  );
}
