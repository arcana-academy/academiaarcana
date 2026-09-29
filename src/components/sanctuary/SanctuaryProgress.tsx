import type { SanctuaryViewModel } from "@/domains/sanctuary";
import { Progress } from "@/components/ui/progress";

type SanctuaryProgressProps = {
  progress: SanctuaryViewModel["progress"];
};

export function SanctuaryProgress({ progress }: SanctuaryProgressProps) {
  return (
    <section
      className="aa-card aa-card-default aa-sanctuary-section"
      aria-labelledby="sanctuary-progress"
    >
      <header>
        <p className="aa-eyebrow">Progresso</p>
        <h2 id="sanctuary-progress">Progresso</h2>
        <p>Veja o avanço disponível para este contexto.</p>
      </header>

      {progress.status === "ready" ? (
        <div className="aa-state-card" data-state="success">
          <p>{progress.data.label}</p>
          <Progress value={progress.data.percentage} label={progress.data.label} />
        </div>
      ) : null}

      {progress.status === "empty" ? (
        <div className="aa-state-card">
          <p>Ainda não há dados de progresso para exibir.</p>
        </div>
      ) : null}

      {progress.status === "not-configured" ? (
        <div className="aa-state-card" data-state="warning">
          <p>O recurso de progresso ainda não está configurado e não há dados disponíveis.</p>
        </div>
      ) : null}

      {progress.status === "error" ? (
        <div className="aa-state-card" data-state="error" role="alert">
          <p>Não foi possível carregar o progresso agora. Tente novamente mais tarde.</p>
        </div>
      ) : null}
    </section>
  );
}
