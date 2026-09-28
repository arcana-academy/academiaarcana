import type { SanctuaryViewModel } from "@/domains/sanctuary";
import { SanctuaryContinueLearning } from "./SanctuaryContinueLearning";
import { SanctuaryHeader } from "./SanctuaryHeader";
import { SanctuaryMissions } from "./SanctuaryMissions";
import { SanctuaryProgress } from "./SanctuaryProgress";
import { SanctuarySchedule } from "./SanctuarySchedule";

type SanctuaryProps = {
  viewModel: SanctuaryViewModel;
};

export function Sanctuary({ viewModel }: SanctuaryProps) {
  return (
    <main className="aa-page-stack" aria-labelledby="sanctuary-title">
      <SanctuaryHeader
        header={viewModel.header}
        primaryAction={viewModel.primaryAction}
      />

      <section className="aa-sanctuary-command" aria-label="Centro da sua jornada">
        <div className="aa-sanctuary-command-primary">
          <SanctuaryContinueLearning
            continueLearning={viewModel.continueLearning}
          />
        </div>

        <aside className="aa-sanctuary-command-secondary">
          <SanctuaryProgress progress={viewModel.progress} />
        </aside>
      </section>

      <section className="aa-sanctuary-grid" aria-label="Sua jornada de hoje">
        <div className="aa-sanctuary-grid-primary">
          <SanctuaryMissions missions={viewModel.missions} />
        </div>
        <aside className="aa-sanctuary-grid-secondary">
          <SanctuarySchedule schedule={viewModel.schedule} />
        </aside>
      </section>
    </main>
  );
}
