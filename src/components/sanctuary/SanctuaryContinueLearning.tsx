import Link from "next/link";
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
        <p>Nenhum estudo recente para retomar ainda. Começar a explorar um novo capítulo quando estiver pronto.</p>
        <div className="aa-sanctuary-hero-action">
          <Link className="aa-button aa-button-secondary" href="/grimorios">
            Explorar Grimórios
          </Link>
        </div>
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
      <div className="aa-sanctuary-path" role="group" aria-label="Caminho atual">
        {path.map((item, index) => (
          <span key={`${item}-${index}`}>
            {index > 0 ? <span aria-hidden="true">› </span> : null}
            {item}
          </span>
        ))}
      </div>
      <div className="aa-sanctuary-hero-action">
        <Link className="aa-button aa-button-primary" href={continueLearning.href}>
          Retomar este estudo
        </Link>
      </div>
    </section>
  );
}
