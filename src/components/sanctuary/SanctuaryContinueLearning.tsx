import Link from "next/link";
import type { SanctuaryViewModel } from "@/domains/sanctuary";

import { SanctuaryEmptyState } from "./SanctuaryEmptyState";

type SanctuaryContinueLearningProps = {
  continueLearning: SanctuaryViewModel["continueLearning"];
};

export function SanctuaryContinueLearning({
  continueLearning,
}: SanctuaryContinueLearningProps) {
  return (
    <section
      className="aa-card aa-card-default aa-sanctuary-section"
      aria-labelledby="sanctuary-continue-learning"
    >
      <header>
        <p className="aa-eyebrow">Retomar</p>
        <h2 id="sanctuary-continue-learning">Continuar aprendendo</h2>
        <p>Volte diretamente ao contexto de estudo em que você parou.</p>
      </header>

      {continueLearning ? (
        <div className="aa-continue-learning">
          <Link className="aa-link" href={continueLearning.href}>
            Continuar aprendendo
          </Link>

          <div className="aa-learning-path" aria-label="Hierarquia do contexto">
            <li>{continueLearning.grimoireTitle}</li>
            {continueLearning.notebookTitle ? <li>{continueLearning.notebookTitle}</li> : null}
            {continueLearning.chapterTitle ? <li>{continueLearning.chapterTitle}</li> : null}
            {continueLearning.pageTitle ? <li>{continueLearning.pageTitle}</li> : null}
          </div>
        </div>
      ) : (
        <SanctuaryEmptyState />
      )}
    </section>
  );
}
