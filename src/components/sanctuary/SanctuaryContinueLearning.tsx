import Link from "next/link";
import type { SanctuaryViewModel } from "@/domains/sanctuary";

type SanctuaryContinueLearningProps = {
  continueLearning: SanctuaryViewModel["continueLearning"];
};

export function SanctuaryContinueLearning({ continueLearning }: SanctuaryContinueLearningProps) {
  if (continueLearning.status === "error") {
    return (
      <section className="aa-empty" aria-labelledby="sanctuary-continue-learning">
        <h2 id="sanctuary-continue-learning" className="aa-visually-hidden">
          Contexto de aprendizagem indisponível
        </h2>
        <div role="status">
          <p>Não foi possível carregar seu contexto de aprendizagem agora.</p>
          <p className="aa-state-copy">Recarregue a página para tentar novamente.</p>
        </div>
      </section>
    );
  }

  if (continueLearning.status === "not-configured") {
    return (
      <section className="aa-empty" aria-labelledby="sanctuary-continue-learning">
        <h2 id="sanctuary-continue-learning" className="aa-visually-hidden">
          Contexto de aprendizagem indisponível
        </h2>
        <p>O contexto de aprendizagem ainda não está configurado.</p>
      </section>
    );
  }

  if (continueLearning.status === "empty") {
    return (
      <section className="aa-empty" aria-labelledby="sanctuary-continue-learning">
        <h2 id="sanctuary-continue-learning" className="aa-visually-hidden">
          Próximo estudo
        </h2>
        <p>Nenhum conteúdo disponível para abrir no Santuário ainda. Explore seus Grimórios quando estiver pronto.</p>
        <div className="aa-sanctuary-hero-action">
          <Link className="aa-button aa-button-secondary" href="/grimorios">
            Explorar Grimórios
          </Link>
        </div>
      </section>
    );
  }

  const learning = continueLearning.data;
  const path = [
    learning.grimoireTitle,
    learning.notebookTitle,
    learning.chapterTitle,
    learning.pageTitle,
  ].filter(Boolean);
  const isResume = learning.intent === "resume";
  const sectionLabel = isResume ? "Continuar aprendendo" : "Explorar conteúdo";
  const pathLabel = isResume ? "Caminho atual" : "Conteúdo sugerido";
  const actionLabel = isResume ? "Retomar este estudo" : "Abrir este estudo";

  return (
    <section aria-labelledby="sanctuary-continue-learning">
      <h2 id="sanctuary-continue-learning" className="aa-visually-hidden">
        {sectionLabel}
      </h2>
      <div className="aa-sanctuary-path" role="group" aria-label={pathLabel}>
        {path.map((item, index) => (
          <span key={`${item}-${index}`}>
            {index > 0 ? <span aria-hidden="true">› </span> : null}
            {item}
          </span>
        ))}
      </div>
      <div className="aa-sanctuary-hero-action">
        <Link className="aa-button aa-button-primary" href={learning.href}>
          {actionLabel}
        </Link>
      </div>
    </section>
  );
}
