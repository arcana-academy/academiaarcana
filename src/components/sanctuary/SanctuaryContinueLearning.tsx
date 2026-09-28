import type { SanctuaryViewModel } from "@/domains/sanctuary";

type SanctuaryContinueLearningProps = {
  continueLearning: SanctuaryViewModel["continueLearning"];
};

export function SanctuaryContinueLearning({ continueLearning }: SanctuaryContinueLearningProps) {
  if (!continueLearning) {
    return (
      <div className="aa-empty" aria-labelledby="sanctuary-continue-learning">
        <p id="sanctuary-continue-learning">Nenhum estudo recente para retomar ainda. Comece um novo capítulo quando estiver pronto.</p>
      </div>
    );
  }

  const path = [
    continueLearning.grimoireTitle,
    continueLearning.notebookTitle,
    continueLearning.chapterTitle,
    continueLearning.pageTitle,
  ].filter(Boolean);

  return (
    <div aria-labelledby="sanctuary-continue-learning">
      <h3 id="sanctuary-continue-learning" className="aa-visually-hidden">
        Continuar aprendendo
      </h3>
      <div className="aa-sanctuary-path">
        {path.map((item, index) => (
          <span key={`${item}-${index}`}>
            {index > 0 ? "› " : ""}{item}
          </span>
        ))}
      </div>
    </div>
  );
}
