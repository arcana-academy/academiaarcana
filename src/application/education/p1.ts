import type {
  EducationalOverview,
  EducationalPracticeRepository,
  PracticeDifficulty,
  PracticeOutcome,
} from "@/domains/education";
import { buildEducationalOverview } from "@/domains/education/p1";

export async function getEducationalOverview(
  repository: EducationalPracticeRepository,
  ownerId: string,
): Promise<EducationalOverview> {
  const [pages, items, attempts] = await Promise.all([
    repository.listPages(ownerId),
    repository.listPracticeItems(ownerId),
    repository.listPracticeAttempts(ownerId),
  ]);

  return buildEducationalOverview(pages, items, attempts);
}

export async function createPractice(
  repository: EducationalPracticeRepository,
  input: {
    ownerId: string;
    pageId: string;
    prompt: string;
    referenceAnswer: string;
    explanation?: string | null;
    difficulty: PracticeDifficulty;
  },
) {
  return repository.createPracticeItem(input);
}

export function buildAttemptInput(input: {
  answer: string;
  outcome: PracticeOutcome;
  practiceItemId: string;
}) {
  const scoreByOutcome: Record<PracticeOutcome, number> = {
    strong: 1,
    partial: 0.6,
    insufficient: 0.2,
  };
  const feedbackByOutcome: Record<PracticeOutcome, string> = {
    strong:
      "Você marcou a recuperação como forte. Compare sua resposta com a referência para conferir se consegue explicar a ideia sem consultar o material.",
    partial:
      "Você marcou a recuperação como parcial. Compare com a referência, identifique o que faltou e faça uma nova tentativa em outro momento.",
    insufficient:
      "Você marcou a recuperação como insuficiente. Isso é evidência para voltar ao conteúdo e praticar novamente; não é um diagnóstico sobre sua capacidade.",
  };

  return {
    practiceItemId: input.practiceItemId,
    answer: input.answer.trim(),
    outcome: input.outcome,
    evidenceScore: scoreByOutcome[input.outcome],
    confidence: "partial" as const,
    feedback: feedbackByOutcome[input.outcome],
  };
}
