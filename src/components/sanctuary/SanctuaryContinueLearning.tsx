import type { SanctuaryViewModel } from "@/domains/sanctuary";

import { SanctuaryEmptyState } from "./SanctuaryEmptyState";

type SanctuaryContinueLearningProps = {
    continueLearning: SanctuaryViewModel["continueLearning"];
};

export function SanctuaryContinueLearning({
    continueLearning,
}: SanctuaryContinueLearningProps) {
    return (
        <section aria-labelledby="sanctuary-continue-learning">
            <h2 id="sanctuary-continue-learning">Continuar aprendendo</h2>

            {continueLearning ? (
                <div>
                    <p>{continueLearning.grimoireTitle}</p>

                    {continueLearning.notebookTitle ? (
                        <p>{continueLearning.notebookTitle}</p>
                    ) : null}

                    {continueLearning.chapterTitle ? (
                        <p>{continueLearning.chapterTitle}</p>
                    ) : null}

                    {continueLearning.pageTitle ? (
                        <p>{continueLearning.pageTitle}</p>
                    ) : null}
                </div>
            ) : (
                <SanctuaryEmptyState />
            )}
        </section>
    );
}
