import type { SanctuaryViewModel } from "@/domains/sanctuary";

import { Progress } from "@/components/ui/progress";

type SanctuaryProgressProps = {
    progress: SanctuaryViewModel["progress"];
};

/**
 * Presentational Progress section for the Sanctuary.
 *
 * Renders `SectionState<ProgressSummary>` explicitly without fabricating,
 * recalculating, or persisting progress data. Only the `ready` state uses
 * the existing `Progress` primitive with the real `percentage`/`label`.
 */
export function SanctuaryProgress({ progress }: SanctuaryProgressProps) {
    return (
        <section aria-labelledby="sanctuary-progress">
            <h2 id="sanctuary-progress">Progresso</h2>

            {progress.status === "ready" ? (
                <>
                    <p>{progress.data.label}</p>
                    <Progress
                        value={progress.data.percentage}
                        label={progress.data.label}
                    />
                </>
            ) : null}

            {progress.status === "empty" ? (
                <p>Ainda não há dados de progresso para exibir.</p>
            ) : null}

            {progress.status === "not-configured" ? (
                <p>
                    O recurso de progresso ainda não está configurado e não há
                    dados disponíveis.
                </p>
            ) : null}

            {progress.status === "error" ? (
                <p>
                    Não foi possível carregar o progresso agora. Tente novamente
                    mais tarde.
                </p>
            ) : null}
        </section>
    );
}
