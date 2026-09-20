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
        <main aria-labelledby="sanctuary-title">
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
        </main>
    );
}