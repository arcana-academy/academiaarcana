import type { SanctuaryViewModel } from "@/domains/sanctuary";

import { Progress } from "@/components/ui/progress";

type SanctuaryProgressProps = {
  progress: SanctuaryViewModel["progress"];
};

/** Present the real progress snapshot without inventing unavailable data. */
export function SanctuaryProgress({ progress }: SanctuaryProgressProps) {
  return (
    <section
      className="sanctuary-card aa-card aa-card-default"
      aria-labelledby="sanctuary-progress"
    >
      <header className="aa-page-header">
        <p className="aa-eyebrow">Progresso</p>
        <h2 id="sanctuary-progress">Progresso</h2>
      </header>

      {progress.status === "ready" ? (
        <div className="sanctuary-data-block">
          <p>{progress.data.label}</p>
          <Progress value={progress.data.percentage} label={progress.data.label} />
        </div>
      ) : null}

      {progress.status === "empty" ? (
        <p className="aa-empty-state">Ainda não há dados de progresso para exibir.</p>
      ) : null}

      {progress.status === "not-configured" ? (
        <p className="aa-empty-state">
          O recurso de progresso ainda não está configurado e não há dados
          disponíveis.
        </p>
      ) : null}

      {progress.status === "error" ? (
        <div className="aa-alert aa-alert-danger" role="alert">
          <p>
            Não foi possível carregar o progresso agora. Tente novamente mais
            tarde.
          </p>
        </div>
      ) : null}
    </section>
  );
}
