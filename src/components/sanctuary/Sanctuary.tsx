import type { SanctuaryViewModel } from "@/domains/sanctuary";
import { SanctuaryEmptyState } from "./SanctuaryEmptyState";
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

            <section aria-labelledby="sanctuary-continue-learning">
                <h2 id="sanctuary-continue-learning">Continuar aprendendo</h2>

                {viewModel.continueLearning ? (
                    <div>
                        <p>{viewModel.continueLearning.grimoireTitle}</p>

                        {viewModel.continueLearning.notebookTitle ? (
                            <p>{viewModel.continueLearning.notebookTitle}</p>
                        ) : null}

                        {viewModel.continueLearning.chapterTitle ? (
                            <p>{viewModel.continueLearning.chapterTitle}</p>
                        ) : null}

                        {viewModel.continueLearning.pageTitle ? (
                            <p>{viewModel.continueLearning.pageTitle}</p>
                        ) : null}
                    </div>
                ) : (
                    <SanctuaryEmptyState />
                )}
            </section>
        </main>
    );
}