import type { SanctuaryViewModel } from "@/domains/sanctuary";

type SanctuaryContinueLearningProps = {
  continueLearning: SanctuaryViewModel["continueLearning"];
};

export function SanctuaryContinueLearning({ continueLearning }: SanctuaryContinueLearningProps) {
  if (!continueLearning) {
    return (
      <section className="aa-empty" aria-labelledby="sanctuary-continue-learning">
        <h2 id="sanctuary-continue-learning" className="aa-visually-hidden">
          Continuar aprendendo
        </h2>
        <p>Nenhum estudo recente para retomar ainda. Comece um novo capítulo quando estiver pronto.</p>
      </section>
    );
  }

  const path = [
    continueLearning.grimoireTitle,
    continueLearning.notebookTitle,
    continueLearning.chapterTitle,
    continueLearning.pageTitle,
  ].filter(Boolean);

  return (
    <section aria-labelledby="sanctuary-continue-learning">
      <h2 id="sanctuary-continue-learning" className="aa-visually-hidden">
        Continuar aprendendo
      </h2>
      <div className="aa-sanctuary-path">
        {path.map((item, index) => (
          <span key={`${item}-${index}`}>
            {index > 0 ? "› " : ""}{item}
          </span>
        ))}
      </div>
    </section>
  );
}
