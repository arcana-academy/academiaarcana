import { SanctuaryGrimoire, ContinueLearningContext } from "./contracts";

/**
 * Resolve o contexto de "Continue Learning" baseado na hierarquia real.
 *
 * Regra de Prioridade:
 * 1. Page -> 2. Chapter -> 3. Notebook -> 4. Grimoire -> 5. null
 *
 * Decisão Determinística:
 * Como não há metadados de "último acesso" no domínio, selecionamos o primeiro item
 * disponível em cada nível da hierarquia baseado na menor 'position'.
 *
 * Para Grimórios (raiz), utilizamos a ordenação alfabética por ID para garantir
 * que o resultado seja consistente independente da ordem do array de entrada.
 */
export function resolveContinueLearning(grimoires: SanctuaryGrimoire[]): ContinueLearningContext | null {
  if (!grimoires || grimoires.length === 0) {
    return null;
  }

  const [grimoire] = [...grimoires].sort((a, b) => a.id.localeCompare(b.id));

  const context: ContinueLearningContext = {
    grimoireId: grimoire.id,
    grimoireTitle: grimoire.title,
  };

  const notebooks = grimoire.notebooks || [];
  if (notebooks.length === 0) return context;
  const [notebook] = [...notebooks].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));

  context.notebookId = notebook.id;
  context.notebookTitle = notebook.title;

  const chapters = notebook.chapters || [];
  if (chapters.length === 0) return context;
  const [chapter] = [...chapters].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));

  context.chapterId = chapter.id;
  context.chapterTitle = chapter.title;

  const pages = chapter.pages || [];
  if (pages.length === 0) return context;
  const [page] = [...pages].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));

  context.pageId = page.id;
  context.pageTitle = page.title;

  return context;
}
