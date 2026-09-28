import Link from "next/link";
import type { SanctuaryViewModel } from "@/domains/sanctuary";

import { SanctuaryEmptyState } from "./SanctuaryEmptyState";

type SanctuaryContinueLearningProps = {
  continueLearning: SanctuaryViewModel["continueLearning"];
};

/** Render the deterministic Continue Learning section and its empty state. */
export function SanctuaryContinueLearning({
  continueLearning,
}: SanctuaryContinueLearningProps) {
  return (
    <section className="sanctuary-card aa-card aa-card-default" aria-labelledby="sanctuary-continue-learning">
      <header className="aa-page-header">
        <p className="aa-eyebrow">Retomada</p>
        <h2 id="sanctuary-continue-learning">Continuar aprendendo</h2>
        <p className="aa-page-intro">
          Retome exatamente o contexto que a camada de aprendizagem forneceu.
        </p>
      </header>

      {continueLearning ? (
        <div className="sanctuary-learning-card">
          <div className="sanctuary-learning-path" aria-label="Contexto de aprendizagem">
            <span>{continueLearning.grimoireTitle}</span>
            {continueLearning.notebookTitle ? (
              <>
                <span aria-hidden="true">›</span>
                <span>{continueLearning.notebookTitle}</span>
              </>
            ) : null}
            {continueLearning.chapterTitle ? (
              <>
                <span aria-hidden="true">›</span>
                <span>{continueLearning.chapterTitle}</span>
              </>
            ) : null}
            {continueLearning.pageTitle ? (
              <>
                <span aria-hidden="true">›</span>
                <span>{continueLearning.pageTitle}</span>
              </>
            ) : null}
          </div>

          <Link
            className="aa-button aa-button-secondary"
            href={continueLearning.href}
          >
            Abrir contexto
          </Link>
        </div>
      ) : (
        <SanctuaryEmptyState />
      )}
    </section>
  );
}
