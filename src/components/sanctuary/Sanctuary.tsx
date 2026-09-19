import type { SanctuaryViewModel } from "@/domains/sanctuary";
import { SanctuaryEmptyState } from "./SanctuaryEmptyState";

type SanctuaryProps = {
    viewModel: SanctuaryViewModel;
};

export function Sanctuary({ viewModel }: SanctuaryProps) {
    const userName = viewModel.header.user.displayName?.trim();

    return (
        <main aria-labelledby="sanctuary-title">
            <header>
                <h1 id="sanctuary-title">{viewModel.header.greeting}</h1>

                {userName ? <p>{userName}</p> : null}
            </header>

            <section aria-labelledby="sanctuary-primary-action">
                <h2 id="sanctuary-primary-action">Ação principal</h2>

                <a href={viewModel.primaryAction.href}>
                    {viewModel.primaryAction.label}
                </a>
            </section>

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