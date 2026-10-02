import type { ObjectiveAttemptOutcome, ObjectiveScoringPolicy } from "./contracts";

export const NORMALIZED_EXACT_MATCH_CRITERION =
  "A resposta deve corresponder à resposta de referência após normalização de caixa e espaços.";

export type ObjectiveEvaluation = {
  outcome: ObjectiveAttemptOutcome;
  evidenceScore: number;
  confidence: "strong";
  feedback: string;
};

/** Normalizes an objective answer without changing its semantic content. */
export function normalizeObjectiveAnswer(value: string): string {
  return value.trim().toLocaleLowerCase("pt-BR").replace(/\s+/g, " ");
}

/** Evaluates the bounded V1 normalized exact-match criterion deterministically. */
export function evaluateObjectiveExactMatch(
  answer: string,
  referenceAnswer: string,
  scoringPolicy: ObjectiveScoringPolicy,
): ObjectiveEvaluation {
  if (scoringPolicy !== "normalized-exact-match") {
    throw new Error("Política objetiva não suportada.");
  }

  const passed =
    normalizeObjectiveAnswer(answer) === normalizeObjectiveAnswer(referenceAnswer);

  return passed
    ? {
        outcome: "pass",
        evidenceScore: 1,
        confidence: "strong",
        feedback:
          "A resposta satisfez o critério de correspondência exata normalizada.",
      }
    : {
        outcome: "fail",
        evidenceScore: 0,
        confidence: "strong",
        feedback:
          "A resposta não satisfez o critério de correspondência exata normalizada. Isso é evidência sobre esta tarefa, não uma conclusão global sobre sua aprendizagem.",
      };
}
