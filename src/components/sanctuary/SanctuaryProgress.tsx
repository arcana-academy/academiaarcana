import type { SanctuaryViewModel } from "@/domains/sanctuary";
import { Progress } from "@/components/ui/progress";

type SanctuaryProgressProps = {
  progress: SanctuaryViewModel["progress"];
};

export function SanctuaryProgress({ progress }: SanctuaryProgressProps) {
  return (
    <div className="aa-sanctuary-section">
      {progress.status === "ready" ? (
        <>
          <div className="aa-progress-copy">
            <strong>{progress.data.label}</strong>
            <span className="aa-status">{progress.data.percentage}%</span>
          </div>
          <Progress value={progress.data.percentage} label={progress.data.label} />
        </>
      ) : null}

      {progress.status === "empty" ? (
        <div className="aa-empty"><p>Ainda não há dados de progresso para exibir.</p></div>
      ) : null}

      {progress.status === "not-configured" ? (
        <div className="aa-empty"><p>O recurso de progresso ainda não está configurado.</p></div>
      ) : null}

      {progress.status === "error" ? (
        <div className="aa-empty"><p>Não foi possível carregar o progresso agora.</p></div>
      ) : null}
    </div>
  );
}
