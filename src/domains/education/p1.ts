import type { PracticeOutcome } from "./contracts";

const feedbackByOutcome: Record<PracticeOutcome, string> = {
  strong:
    "Você marcou a recuperação como forte. Compare sua resposta com a referência para conferir se consegue explicar a ideia sem consultar o material.",
  partial:
    "Você marcou a recuperação como parcial. Compare com a referência, identifique o que faltou e faça uma nova tentativa em outro momento.",
  insufficient:
    "Você marcou a recuperação como insuficiente. Isso é evidência para voltar ao conteúdo e praticar novamente; não é um diagnóstico sobre sua capacidade.",
};

const scoreByOutcome: Record<PracticeOutcome, number> = {
  strong: 1,
  partial: 0.6,
  insufficient: 0.2,
};

export function buildAttemptInput(input: {
  answer: string;
  outcome: PracticeOutcome;
  practiceItemId: string;
}) {
  return {
    practiceItemId: input.practiceItemId,
    answer: input.answer.trim(),
    outcome: input.outcome,
    evidenceScore: scoreByOutcome[input.outcome],
    confidence: "partial" as const,
    feedback: feedbackByOutcome[input.outcome],
  };
}
