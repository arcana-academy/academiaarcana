import type { WorkspaceState } from "@/domains/learning";

type WorkspaceJourneyGuideProps = {
  state: WorkspaceState;
};

/**
 * Explain the next editable level of the existing persisted Workspace hierarchy.
 * This guide never performs a write or assumes that creating a page completes a mission.
 */
export function WorkspaceJourneyGuide({ state }: WorkspaceJourneyGuideProps) {
  const selectedStep = !state.grimoireId
    ? 0
    : !state.notebookId
      ? 1
      : !state.chapterId
        ? 2
        : 3;

  const instructions = [
    "Crie seu primeiro grimório ou selecione um da biblioteca.",
    "Crie um caderno dentro do grimório selecionado ou escolha um existente.",
    "Crie um capítulo dentro do caderno ou abra um capítulo existente.",
    "Crie ou selecione uma página. Depois, escreva, salve e avance para a Prática.",
  ] as const;

  const steps = ["Grimório", "Caderno", "Capítulo", "Página"] as const;

  return (
    <section
      className="aa-surface academy-path-group"
      aria-labelledby="workspace-journey-heading"
      data-journey-step={steps[selectedStep]}
    >
      <div className="academy-path-group-header">
        <p className="aa-eyebrow">Jornada de aprendizagem</p>
        <h3 id="workspace-journey-heading">Construa seu caminho de estudo</h3>
        <p>
          Cada etapa usa o conteúdo que você criou. As missões e o progresso são
          registrados por ações reais, sem recompensas inventadas.
        </p>
      </div>
      <ol className="aa-list" aria-label="Etapas da criação do conteúdo">
        {steps.map((step, index) => (
          <li
            className="aa-list-item"
            key={step}
            aria-current={index === selectedStep ? "step" : undefined}
          >
            <span>
              {index + 1}. {step}
              {index < selectedStep ? " · escolhido" : index === selectedStep ? " · etapa atual" : ""}
            </span>
          </li>
        ))}
      </ol>
      <p role="status" aria-live="polite">{instructions[selectedStep]}</p>
      {state.pageId ? (
        <p className="aa-state-copy">
          Página selecionada: edite, salve e use as ações de Prática e
          Cronograma disponíveis no editor. Concluir uma tarefa de estudo
          pode gerar uma recompensa registrada; abrir esta página não gera XP.
        </p>
      ) : null}
    </section>
  );
}
