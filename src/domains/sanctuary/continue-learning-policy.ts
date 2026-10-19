import { SanctuaryGrimoire, ContinueLearningContext } from "./contracts";

/**
 * Resolve o contexto de "Continue Learning" baseado na hierarquia real.
 *
 * Regra de Prioridade:
 * 1. Page -> 2. Chapter -> 3. Notebook -> 4. Grimoire -> 5. null
 *
 * Decisão Determinística:
 * Como não há metadados de "último acesso", preferimos primeiro a maior
 * profundidade disponível (página, capítulo, caderno ou grimório). Em empate,
 * usamos a ordem determinística da hierarquia: ID para grimórios e position/ID
 * para seus descendentes. Essa escolha é exploração, nunca retomada.
 *
 * Para Grimórios (raiz), utilizamos a ordenação alfabética por ID para garantir
 * que o resultado seja consistente independente da ordem do array de entrada.
 */
export function resolveContinueLearning(grimoires: SanctuaryGrimoire[]): ContinueLearningContext | null {
  if (!grimoires?.length) return null;

  let selected: ContinueLearningContext | null = null;
  let selectedDepth = 0;
  /** Keep the first candidate at the greatest depth: grimoire 1 through page 4. */
  const consider = (candidate: ContinueLearningContext, depth: number) => {
    if (depth > selectedDepth) {
      selected = candidate;
      selectedDepth = depth;
    }
  };
  /** Order siblings by ascending position, breaking ties by ID. */
  const byPositionThenId = <T extends { position: number; id: string }>(a: T, b: T) =>
    a.position - b.position || a.id.localeCompare(b.id);

  for (const grimoire of [...grimoires].sort((a, b) => a.id.localeCompare(b.id))) {
    const atGrimoire: ContinueLearningContext = {
      intent: "explore",
      grimoireId: grimoire.id,
      grimoireTitle: grimoire.title,
    };
    consider(atGrimoire, 1);

    for (const notebook of [...(grimoire.notebooks ?? [])].sort(byPositionThenId)) {
      const atNotebook: ContinueLearningContext = {
        ...atGrimoire,
        notebookId: notebook.id,
        notebookTitle: notebook.title,
      };
      consider(atNotebook, 2);

      for (const chapter of [...(notebook.chapters ?? [])].sort(byPositionThenId)) {
        const atChapter: ContinueLearningContext = {
          ...atNotebook,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
        };
        consider(atChapter, 3);

        for (const page of [...(chapter.pages ?? [])].sort(byPositionThenId)) {
          consider({ ...atChapter, pageId: page.id, pageTitle: page.title }, 4);
          // Hierarchy has already been traversed in deterministic tie-break order.
          return selected;
        }
      }
    }
  }
  return selected;
}
