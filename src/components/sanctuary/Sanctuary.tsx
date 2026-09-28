import type { SanctuaryViewModel } from "@/domains/sanctuary";
import { SanctuaryContinueLearning } from "./SanctuaryContinueLearning";
import { SanctuaryHeader } from "./SanctuaryHeader";
import { SanctuaryMissions } from "./SanctuaryMissions";
import { SanctuaryProgress } from "./SanctuaryProgress";
import { SanctuarySchedule } from "./SanctuarySchedule";

type SanctuaryProps = {
  viewModel: SanctuaryViewModel;
};

/** Render the complete Sanctuary from its already-resolved view model. */
export function Sanctuary({ viewModel }: SanctuaryProps) {
  return (
    <main
      className="aa-page aa-page-wide sanctuary-page"
      aria-labelledby="sanctuary-title"
    >
      <div className="sanctuary-stack">
        <SanctuaryHeader
          header={viewModel.header}
          primaryAction={viewModel.primaryAction}
        />

        <SanctuaryContinueLearning
          continueLearning={viewModel.continueLearning}
        />

        <SanctuaryProgress progress={viewModel.progress} />

        <SanctuaryMissions missions={viewModel.missions} />

        <SanctuarySchedule schedule={viewModel.schedule} />
      </div>
    </main>
  );
}
