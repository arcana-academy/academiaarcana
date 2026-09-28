import type { SanctuaryViewModel } from "@/domains/sanctuary";
import { Progress } from "@/components/ui/progress";

type SanctuaryProgressProps = {
  progress: SanctuaryViewModel["progress"];
};

export function SanctuaryProgress({ progress }: SanctuaryProgressProps) {
  return (
    <section className="aa-sanctuary-panel" aria-labelledby="sanctuary-progress">
      <div className="aa-section-heading">
        <div>
          <span className="aa-section-kicker">Visão de jornada</span>
          <h2 id="sanctuary-progress">Progresso</h2>
        </div>
      </div>

      {progress.status === "ready" ? (
        <div className="aa-progress-summary">
          <p>{progress.data.label}</p>
          <Progress value={progress.data.percentage} label={progress.data.label} />
        </div>
      ) : null}
      {progress.status === "empty" ? <p className="aa-state-message">Ainda não há dados de progresso para exibir.</p> : null}
      {progress.status === "not-configured" ? <p className="aa-state-message">O recurso de progresso ainda não está configurado e não há dados disponíveis.</p> : null}
      {progress.status === "error" ? <p className="aa-state-message aa-state-danger">Não foi possível carregar o progresso agora. Tente novamente mais tarde.</p> : null}
    </section>
  );
}
