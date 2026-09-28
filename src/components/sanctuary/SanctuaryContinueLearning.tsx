import type { SanctuaryViewModel } from "@/domains/sanctuary";
import { SanctuaryEmptyState } from "./SanctuaryEmptyState";

type SanctuaryContinueLearningProps = {
  continueLearning: SanctuaryViewModel["continueLearning"];
};

export function SanctuaryContinueLearning({ continueLearning }: SanctuaryContinueLearningProps) {
  return (
    <section className="aa-sanctuary-feature" aria-labelledby="sanctuary-continue-learning">
      <div className="aa-section-heading">
        <div>
          <span className="aa-section-kicker">Em andamento</span>
          <h2 id="sanctuary-continue-learning">Continuar aprendendo</h2>
        </div>
        <span className="aa-section-symbol" aria-hidden="true">01</span>
      </div>

      {continueLearning ? (
        <div className="aa-learning-path">
          <div className="aa-learning-icon" aria-hidden="true">◈</div>
          <div className="aa-learning-copy">
            <p className="aa-learning-title">{continueLearning.grimoireTitle}</p>
            <div className="aa-learning-trail" aria-label="Caminho atual">
              {continueLearning.notebookTitle ? <span>{continueLearning.notebookTitle}</span> : null}
              {continueLearning.chapterTitle ? <span>{continueLearning.chapterTitle}</span> : null}
              {continueLearning.pageTitle ? <span>{continueLearning.pageTitle}</span> : null}
            </div>
          </div>
          <a className="aa-button aa-button-secondary aa-button-sm" href={continueLearning.href}>
            Retomar
          </a>
        </div>
      ) : (
        <div className="aa-sanctuary-empty"><SanctuaryEmptyState /></div>
      )}
    </section>
  );
}
