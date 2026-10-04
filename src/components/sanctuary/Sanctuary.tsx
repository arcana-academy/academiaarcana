import Link from "next/link";
import type { SanctuaryViewModel } from "@/domains/sanctuary";
import { SanctuaryContinueLearning } from "./SanctuaryContinueLearning";
import { SanctuaryHeader } from "./SanctuaryHeader";
import { SanctuaryMissions } from "./SanctuaryMissions";
import { SanctuaryProgress } from "./SanctuaryProgress";
import { SanctuarySchedule } from "./SanctuarySchedule";
import { RelewiseSearch } from "@/components/search/RelewiseSearch";
import { MestreArcanoPanel } from "./MestreArcanoPanel";

type SanctuaryProps = {
  viewModel: SanctuaryViewModel;
};

export function Sanctuary({ viewModel }: SanctuaryProps) {
  return (
    <main className="aa-page aa-sanctuary" aria-labelledby="sanctuary-title">
      <SanctuaryHeader
        header={viewModel.header}
        primaryAction={viewModel.primaryAction}
      />

      <RelewiseSearch />

      <section className="aa-sanctuary-command" aria-label="Comando da jornada">
        <div className="aa-sanctuary-command-primary">
          <p className="aa-eyebrow">Próximo passo</p>
          <h2>Continue aprendendo</h2>
          <SanctuaryContinueLearning continueLearning={viewModel.continueLearning} />
        </div>

        <div className="aa-sanctuary-command-secondary">
          <p className="aa-eyebrow">Visão geral</p>
          <h2>Seu progresso</h2>
          <SanctuaryProgress progress={viewModel.progress} />
        </div>
      </section>

      <section className="aa-surface aa-sanctuary-section" aria-labelledby="adaptive-recommendation-title">
        <p className="aa-eyebrow">Adaptação · evidência</p>
        <h2 id="adaptive-recommendation-title">{viewModel.adaptiveRecommendation.title}</h2>
        <p>{viewModel.adaptiveRecommendation.message}</p>
        <p className="aa-state-copy">{viewModel.adaptiveRecommendation.reason}</p>
        <Link className="aa-button aa-button-secondary aa-button-sm" href={viewModel.adaptiveRecommendation.href}>
          Seguir recomendação
        </Link>
      </section>

      <MestreArcanoPanel />

      <div className="aa-sanctuary-grid">
        <SanctuaryMissions missions={viewModel.missions} />
        <SanctuarySchedule schedule={viewModel.schedule} />
      </div>
    </main>
  );
}
