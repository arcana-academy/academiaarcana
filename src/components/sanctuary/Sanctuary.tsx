import type { SanctuaryViewModel } from "@/domains/sanctuary";
import { SanctuaryContinueLearning } from "./SanctuaryContinueLearning";
import { SanctuaryHeader } from "./SanctuaryHeader";

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
        </main>
    );
}